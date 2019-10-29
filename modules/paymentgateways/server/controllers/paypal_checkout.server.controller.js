'use strict'

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    customerFunctions = require(path.resolve('./custom_functions/customer_functions.js')),
    authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller')),
    subscriptionFunctions = require(path.resolve('./custom_functions/sales.js')),
    winston = require(path.resolve('./config/lib/winston'));


exports.handleIPN = function(req, res) {
    let ipnEvent = req.body;
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    } else {
        // Return empty 200 response to acknowledge IPN post success.
        res.status(200).end();
    }

    if (!ipnEvent.custom) {
        winston.error("IPN message is missing custom");
        return;
    }

    let metadata = ipnEvent.custom.split(',');

    if(ipnEvent.payment_status == 'Completed') {
        //subscription payment commited
        let order = {};
        order.id = ipnEvent.txn_id;
        order.total = ipnEvent.mc_gross;

        //req.body.product_id = order.product_name;
        req.body.firstname = ipnEvent.first_name;;
        req.body.lastname = ipnEvent.last_name;
        req.body.address = ipnEvent.address_street;
        req.body.city = ipnEvent.address_city   ;
        req.body.country = ipnEvent.address_country_code;
        req.body.telephone = '';

        req.body.email = ipnEvent.payer_email;
        req.body.username = metadata[0];
        req.body.salt = authenticationHandler.makesalt();
        req.body.password = (req.body.password) ? req.body.password : "1234";
        req.body.channel_stream_source_id = (req.body.channel_stream_source_id) ? req.body.channel_stream_source_id : 1;
        req.body.vod_stream_source = (req.body.vod_stream_source) ? req.body.vod_stream_source : 1;
        req.body.pin = (req.body.pin) ? req.body.pin : 1234;

        if (metadata.length == 1 || metadata[1] == 'subscr') {
            if (metadata.length > 1 && metadata[1] == 'subscr') {
                order.product_id = ipnEvent.item_number ? ipnEvent.item_number : ipnEvent.item_number1;
            }
            else {
                order.product_id = ipnEvent.item_name;
            }

            req.body.product_id = order.product_id;
            
            db.salesreport.findOne({
                where: {transaction_id: order.id} //, include: [{model:db.combo_packages,include:[db.package]}]
            }).then(transaction => {
                if (transaction) { //transaction found
                    winston.info('This order has already been processed. orderid:'+order.id);
                }
                else {
                    customerFunctions.find_or_create_customer_and_login(req, res)
                    .then(customer => {
                        if (customer.status) {
                            db.combo.findOne({
                                where:{product_id: order.product_id, isavailable: true}
                            }).then(prod => {
                                if(!prod) {
                                    winston.info('Product send from Paypal not found');
                                }
                                else {  
                                    subscriptionFunctions.add_subscription_transaction(req, res, 1, order.id)
                                    .then(result => {
                                        if(result.status) {
                                            winston.info(result)
                                        }
                                        else
                                        {
                                            winston.error(result)
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
    
        }
        else if (metadata[1] === 'vod'){
            let product_id = ipnEvent.item_number ? ipnEvent.item_number : ipnEvent.item_number1;
            db.salesreport.findOne({
                where: {transaction_id: order.id}
            })
            .then (transaction => {
                if (transaction) {
                    winston.info("This order has already been processed. orderid:" + order.id);
                }
                else {
                    customerFunctions.find_or_create_customer_and_login(req, res)
                    .then(customer => {
                        if (customer.status) {
                            subscriptionFunctions.buy_movie(req, res, metadata[0], product_id, order.id);
                        }
                    });
                }
            })
        }
    }
    else if (ipnEvent.payment_status == 'Refunded') {
        //deactivate
        db.salesreport.findOne({
            where: {transaction_id: ipnEvent.parent_txn_id}
        })
        .then((transaction) => {
            if (transaction) {
                //assign product id
                req.body.product_id = transaction.combo_id;
                db.login_data.findOne({
                    where: {id: transaction.login_data_id}
                })
                .then((user) => {
                    if (user) {
                        req.body.username = user.username;
                        if (metadata.length == 1) {
                            subscriptionFunctions.add_subscription_transaction(req, res, -1, ipnEvent.parent_txn_id)
                            .then((result) => {
                                if(result.status) {
                                    winston.info(result)
                                }
                                else
                                {
                                    winston.error(result)
                                }
                            });
                        }
                    }
                });
            }
            else {
                winston.info({status: false, message: "Transaction not found"});
            }
        });
    }
}

exports.renderForm = function(req, res) {
    let username = req.query.username;

    if (!username) {
        res.send({status: false, mesage: "Missing parameters"});
    }
    else {
        res.render(path.resolve('modules/paymentgateways/server/templates/paypal-checkout'), {
            username: username,
            product_id: '1',
            product_name: 'Guest',
            price: 25,
            type: 'subscr'
        });
    }
}