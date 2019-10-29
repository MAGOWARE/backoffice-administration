'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller')),
    winston = require(path.resolve('./config/lib/winston')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    db_t = require(path.resolve('./config/lib/sequelize')),
    DBModel = db.login_data;


exports.create_customer_data = function(req,res) {
    req.body.group_id = 1;

    return db.customer_data.findOne({
             where: {email: req.body.email.toLowerCase()}
        }).then(function (customer_response) {
            if (customer_response) {
                return {status: true, message: "User found, email address already exists"}; //return if email address found
            }
            else {
                return db.customer_data.create(newData).then(function(result) {
                    if (!result) {
                        return {status: false, message: "there was an error creating customer data"}
                    } else {
                        return {status: true, message: "Customer datasuccessfullyccessfuly"}
                    }
                }).catch(function(err) {
                    winston.error('error creating customer data: ',err);
                    return {status: false, message: "there was an error creating customer data"}
                });
            }
        });


    /*
    return db.login_data.upsert(
                req.body
             ).then(function(result) {
                return {status: true, message: "Customer data created or updated successfully."}
            }).catch(function (err) {
                winston.error('error upserting login_data ',err);
                return {status: false, message: "there was an error running query"}
            });
            */
};


exports.create_login_data = function(req, res, login_data_username) {
    var newData = req.body;
        newData.salt = authenticationHandler.makesalt();
        if(!login_data_username) return {status: false, message: "username cannot be blank"};
        newData.username = login_data_username;
        if(!newData.customer_id) newData.customer_id = 1; //default value for creating loing accounts.
        if(!newData.password) newData.password = login_data_username;
        if(!newData.channel_stream_source_id) newData.channel_stream_source_id = 1;
        if(!newData.vod_stream_source) newData.vod_stream_source = 1;
        if(!newData.customer_id) newData.customer_id = 1;
        if(!newData.pin) newData.pin = 1234;

        newData['updatedate'] = new Date();

        return DBModel.findOne({
                where: {username: login_data_username.toLowerCase()}
            }).then(function (login_record) {
                if (login_record) {
                    return {status: true, message: "user found"}
                }
                else{
                return DBModel.create(newData).then(function(result) {
                        if (!result) {
                            return {status: false, message: "there was an error creating username"}
                        } else {
                            return {status: true, message: "user created successfuly"}
                        }
                    }).catch(function(err) {
                        winston.error("Error creating user account: ", err);
                            return {status: false, message: "there was an error creating username"}
                    });
                }
            }).catch(function (err) {
                winston.error("Error searching for the user account: ", err);
                return {status: false, message: "there was an error running query"}
            });
};



exports.create_customer_with_login = function(req, res) {
    const COMPANY_ID = req.body.company_id || 1;
    return db.customer_data.findOne({
                where: {email: req.body.email.toLowerCase()}
            }).then(function (customer_response) {
                if (customer_response) {
                    return {status: false, customer_id: customer_response.id, message: "Email address already exists"}; //return if email address found
                }
                else{
                    //search if username exists
                    return db.login_data.findOne({
                            where: {username: req.body.username.toLowerCase(), company_id: COMPANY_ID}
                        }).then(function (login_data) {
                            if (login_data) {
                                return {status: false, login_data: true, message: "Username already exists"} //return if username found
                            }
                            else {
                                //begin data customer creation transaction
                                return db_t.sequelize.transaction(function (t) {
                                    req.body.group_id = (req.body.group_id) ? req.body.group_id:1;
                                    req.company_id = (req.token) ? req.token.company_id : 1;

                                    return db.customer_data.create(
                                        req.body,{transaction: t}
                                    ).then(function (new_customer) {
                                        req.body.customer_id = new_customer.id;
                                        req.body.salt = authenticationHandler.makesalt();
                                        req.body.password = (req.body.password)?req.body.password:"1234";
                                        req.body.channel_stream_source_id = (req.body.channel_stream_source_id)?req.body.channel_stream_source_id:1;
                                        req.body.vod_stream_source = (req.body.vod_stream_source)?req.body.vod_stream_source:1;
                                        req.body.pin = (req.body.pin)?req.body.pin:1234;
                                        return db.login_data.create(req.body, {transaction: t});
                                    });
                                }).then(function (result) {
                                    // Transaction has been committed
                                    return {status: true, message: result};
                                }).catch(function (err) {
                                    // Transaction has been rolled back
                                    winston.error("error creating customer: ",err);
                                    return {status: false, message: "Error creating customer - " + err.message};
                                });
                            }
                        })
                }
            }).catch(function (err) {
                winston.error("error running the query: ",err);
                return {status: false, message: "there was an error running the query "+err.message}
            });
};


exports.find_or_create_customer_and_login = function(req, res) {

    return db.customer_data.findOne({
        where: {email: req.body.email.toLowerCase()}
    }).then(function (customer_response) {

        //if customer data email found
        if (customer_response) {
            req.body.customer_id = customer_response.id;

            return db.login_data.findOne({
                where: {username: req.body.username.toLowerCase()}
            }).then(function (login_record) {
                if (login_record) {
                    return {status: true, message: "User account found"}
                }
                else{
                    return db.login_data.create(req.body).then(function(result) {
                        if (!result) {
                            return {status: false, message: "There was an error creating login data"}
                        } else {
                            return {status: true, message: "Login data created successfully"}
                        }
                    }).catch(function(err) {
                        winston.error('error creating login data - ',err);
                        return {status: false, message: "There was an error creating login data"}
                    });
                }
            }).catch(function (err) {
                winston.error('error finding login data - ',err);
                return {status: false, message: "There was an error finding login data"}
            });
        }
        //if customer data email not found
        else {
            //search if username exists
            return db.login_data.findOne({
                where: {username: req.body.username.toLowerCase()}
            }).then(function (login_data) {
                if (login_data) {
                    return {status: true, login_data: true, message: "Username already exists"} //return if username found
                }
                else {
                    //begin data customer creation transaction

                    return db_t.sequelize.transaction(function (t) {
                        req.body.group_id = (req.body.group_id) ? req.body.group_id : 1;
                        //req.body.company_id = login_data.company_id;
                        return db.customer_data.create(
                            req.body, {transaction: t}
                        ).then(function (new_customer) {
                            req.body.customer_id = new_customer.id;
                            return db.login_data.create(req.body, {transaction: t});
                        });
                    }).then(function (result) {
                        // Transaction has been committed
                        return {status: true, message: "Customer data and login account created successfully"};
                    }).catch(function (err) {
                        // Transaction has been rolled back
                        winston.error("error creating customer: ", err);
                        return {status: false, message: "Error creating customer - " + err.message};
                    });
                }
            })
        }

    }).catch(function (err) {
        winston.error("Error running the query: ",err);
        return {status: false, message: "there was an error running the query find customer data "+err.message}
    });
};