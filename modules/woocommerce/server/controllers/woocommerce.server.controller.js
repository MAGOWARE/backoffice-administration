'use strict'
var path = require('path'),
    WooCommerce = require('woocommerce-api'),
    response = require(path.resolve("./config/responses.js")),
    db = require(path.resolve('./config/lib/sequelize')).models,
    subscriptionFunctions = require(path.resolve('./custom_functions/sales.js')),
    customerFunctions = require(path.resolve('./custom_functions/customer_functions.js')),
    authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller')),
    DBpayment_transactions = db.payment_transactions,
    DBsalereport = db.salereport,
    async = require('async'),
    winston = require(path.resolve('./config/lib/winston'));



/*
* @api {post} /apiv2/woocommerce/order_status_completed Woocommerce webhook
* @apiVersion 0.2.0
* @apiName Order Status Complete
* @apiGroup WooCommerce
*/
exports.woocommerce_order_status_change = function(req,res) {
    var thisresponse = new response.OK();

    var wooCommerce = new WooCommerce({
        url: 'http://woocommerce.magoware.tv',  //todo: read from settings
        //ssl: true,
        wpAPI: true,
        version: 'wc/v1',
        consumerKey: 'YOUR_CUSTOMER_KEY_HERE', //todo: read from settings
        consumerSecret: 'YOUR_CUSTOMER_SECRET_HERE' //todo: read from settings
    });



    wooCommerce.getAsync('orders/'+req.body.arg)
        .then(function(result) {

            if(result.statusCode === 403) {return res.send({status : false, message : "order not found"})};

            let woo_data = JSON.parse(result.toJSON().body);
            let thisorder = {};
                thisorder.id = woo_data.id;
                thisorder.order_key = woo_data.order_key;
                thisorder.status = woo_data.status;
                thisorder.total = woo_data.total;
                thisorder.customer_email = woo_data.billing.email;
                thisorder.sku = (woo_data.line_items[0].sku) ? woo_data.line_items[0].sku : 'nosku';
                thisorder.product_name = woo_data.line_items[0].name;

                //var this request data
                req.body.product_id = (woo_data.line_items[0].sku) ? woo_data.line_items[0].sku : '';
                req.body.product_name = woo_data.line_items[0].name;

                //default data
                req.body.firstname = woo_data.billing.first_name;
                req.body.lastname = woo_data.billing.last_name;
                req.body.address = woo_data.billing.address_1;
                req.body.city = woo_data.billing.city   ;
                req.body.country = woo_data.billing.country;
                req.body.telephone = woo_data.billing.phone;

                req.body.email = woo_data.billing.email;
                req.body.username = (woo_data.billing.username) ? woo_data.billing.username : woo_data.billing.email;

                req.body.salt = authenticationHandler.makesalt();
                req.body.password = (req.body.password) ? req.body.password : "1234";
                req.body.channel_stream_source_id = (req.body.channel_stream_source_id) ? req.body.channel_stream_source_id : 1;
                req.body.vod_stream_source = (req.body.vod_stream_source) ? req.body.vod_stream_source : 1;
                req.body.pin = (req.body.pin) ? req.body.pin : 1234;

            //if order is processing or complete
            if(thisorder.status === 'processing' || thisorder.status === 'completed') {
                db.salesreport.findOne({
                    where: {transaction_id: thisorder.order_key} //, include: [{model:db.combo_packages,include:[db.package]}]
                }).then(function(thistransaction) {
                    if (thistransaction) { //transaction found
                        return res.send({status: false, message: 'This order has already been processed. orderid:'+thisorder.id});
                    }
                    else {
                        return customerFunctions.find_or_create_customer_and_login(req, res).then(function (customer_data) {
                            if (customer_data.status) {
                                return db.combo.findOne({
                                    where: {
                                        $or: {product_id: thisorder.sku, name: thisorder.product_name},
                                        isavailable: true
                                    },
                                    //include: [{model: db.customer_data}]
                                }).then(function (result) {
                                    if (!result) {
                                        return res.send({status: false, message: 'Product send from Woocommerce not found'});
                                    } else {
                                        return subscriptionFunctions.add_subscription_transaction(req, res, 1, thisorder.order_key).then(function (result) {
                                            if (result.status) {
                                                res.status(200).send(result)
                                            }
                                            else {
                                                res.status(300).send(result)
                                            }
                                        });
                                    }
                                }).catch(function (err) {
                                    winston.error('error adding subscription', err);
                                    return {status: false, message: "Error adding subscription - " + err.message};
                                });
                            }
                            else {
                                res.send(customer_data);
                            }
                        });
                    }
                })
            }
            //if order changes order to refunded
            else if(thisorder.status === 'refunded') {
                db.salesreport.findOne({
                    where: {transaction_id: thisorder.order_key, active:1} //, include: [{model:db.combo_packages,include:[db.package]}]
                }).then(function(thistransaction) {
                    if (thistransaction) {
                        return subscriptionFunctions.add_subscription_transaction(req, res, -1, thisorder.order_key).then(function (result) {
                            if (result.status) {
                                res.status(200).send(result)
                            }
                            else {
                                res.status(300).send(result)
                            }
                        })
                    }
                    else {
                        return res.send({status: false, message: "Order already innactive ... rollback."})
                    }
                })
            }

            //if order status is differnet from processing, complete, refunded
            else {
                return res.send({status: false, message: "Order status unknown ..."})
            }
        })
        .catch(function (err) {
            winston.error('error getting order from woocommerce',err);
            res.send(err);
        });

};
