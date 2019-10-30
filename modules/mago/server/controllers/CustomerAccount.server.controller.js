'use strict';
//part of customization for mettre

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    saas_functions = require(path.resolve('./custom_functions/saas_functions')),
    subscription_functions = require(path.resolve('./custom_functions/sales.js')),
    customerFunctions = require(path.resolve('./custom_functions/customer_functions.js')),
    responses = require(path.resolve("./config/responses.js")),
    db = require(path.resolve('./config/lib/sequelize')).models,
    Sequelize = require('sequelize'),
    db_t = require(path.resolve('./config/lib/sequelize')),
    DBModel = db.login_data;
var db_t = require(path.resolve('./config/lib/sequelize'));


/**
 * @api {post} /api/customerdata Create Customer
 * @apiVersion 0.2.0
 * @apiName Create Customer
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 * @apiParam {Number} group_id  Mandatory field group_id.
 * @apiParam {String} firstname  Mandatory field firstname.
 * @apiParam {String} lastname  Mandatory field lastname.
 * @apiParam {String} email  Mandatory field email.
 * @apiParam {String} address  Mandatory field address.
 * @apiParam {String} city  Mandatory field city.
 * @apiParam {String} country  Mandatory field country.
 * @apiParam {String} telephone  Mandatory field telephone.
 * @apiSuccess (200) {String} message Record created successfuly
 * @apiError (40x) {String} message Error message on creating customer data.
 */


exports.create_customer_with_login = function(req,res) {
    req.body.company_id = req.token.company_id; //save record for this company
    var limit = req.app.locals.backendsettings[req.token.company_id].asset_limitations.client_limit; //number of client accounts that this company can create
    if((req.body.username) && (req.body.email)) {
        req.body.username = req.body.username.toLowerCase();
        req.body.email = req.body.email.toLowerCase();

        saas_functions.check_limit('login_data', limit).then(function(limit_reached){
            if(limit_reached === true) return res.status(400).send({message: "You have reached the limit number of client accounts you can create for this plan. "});
            else{
                customerFunctions.create_customer_with_login(req,res).then(function(data) {
                    if(data.status) {
                        res.status(200).send(data.message);
                    }
                    else {
                        res.status(400).send(data.message);
                    }
                });
            }
        }).catch(function(error){
            winston.error("Error checking for the limit number of client accounts for company with id ",req.token.company_id," - ", error);
            return res.status(400).send({message: "The limit number of client accounts you can create for this plan could not be verified. Check your log file for more information."});
        });
    }
    else {
        res.status(400).send("Email address or Username can not be blank.");
        return null
    }

};

/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.loginData.company_id === req.token.company_id) res.json(req.loginData);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};


/**
 * List
 */

exports.list = function(req, res) {

    var qwhere = {},
        final_where = {},
        query = req.query;

    if(query.customer_id) qwhere.customer_id = query.customer_id;
    if(query.login_id) qwhere.id = query.login_id;

    //search client account by username
    if (query.username) qwhere.username = query.username; //full text search
    else if (query.q) {
        qwhere.$or = {};
        qwhere.$or.username = {};
        qwhere.$or.username.$like = '%' + query.q + '%'; //partial search        
    }

    var customer_data_where = {};
    var emailFilter = req.query['customer_datum.email'];
    var nameFilter = req.query['customer_datum.firstname'];


    if (emailFilter) {
        customer_data_where = {$or: {email: {$like: '%' + emailFilter + '%'}}};
    }



    if (nameFilter) {
        customer_data_where = {
            $or: {
                //db.sequelize.fn("concat",

                where: Sequelize.where(Sequelize.fn("CONCAT", Sequelize.col("firstname")," ", Sequelize.col("lastname")), {
                    like: '%' + nameFilter + '%'
                })
            }
        }
    }

    //
    // if (nameFilter) {
    //     customer_data_where = {
    //         $or: {
    //             firstname : {$like: '%' + nameFilter + '%'}
    //         }
    //     };
    // }

    //start building where
    final_where.where = qwhere;
    if(parseInt(query._end) !== -1){
        if(parseInt(query._start)) final_where.offset = parseInt(query._start);
        if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    }
    if(query._orderBy) final_where.order = [[query._orderBy, query._orderDir]];
    final_where.include = [{model:db.customer_data,required:true, where: customer_data_where}];
    //end build final where

    final_where.where.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll(

        final_where

    ).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {

            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        res.jsonp(err);
    });
};


/**
 * middleware
 */
exports.dataByID = function(req, res) {
    const id = req.params.customerId;

    DBModel.findOne({
        where: {
            id: id,
            company_id: req.token.company_id
        },
        include: [{model: db.customer_data}]
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.loginData = result;
            res.json(result);
            return null;
        }
    }).catch(function(err) {
        return winston.error("Error at fetching by id, customer account", err);
    });

};


exports.updateClient = function(req, res){

    //login_data record needs to be updated as an instance for the beforeHook to work
    db.login_data.findOne({
        where: {id: req.params.customerId, company_id: req.token.company_id}
    }).then(function (client_instance) {
        return db_t.sequelize.transaction(function (t) {
            return db.customer_data.update(
                req.body.customer_datum,
                {
                    where: {id: req.body.customer_datum.id},
                    transaction: t
                }
            ).then(function (updated_customer) {
                return client_instance.update(req.body, {where: {id: req.params.customerId}, transaction: t});
            });
        }).then(function (result) {
            // Transaction has been committed
            return res.jsonp({status: 200, message: "Customer updated successfully"});
        }).catch(function (error) {
            // Transaction has been rolled back
            return res.status(400).send({message: "Error updating customer - " + error.errors[0].message});
        });
    }).catch(function (error) {
        // Transaction has been rolled back
        return res.status(400).send({message: "Error updating customer"});
    });


};

