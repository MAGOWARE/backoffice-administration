'use strict'

var path = require('path'),
    db = require(path.resolve('config/lib/sequelize')).models,
    authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller')),
    customerFunctions = require(path.resolve('./custom_functions/customer_functions.js')),
    winston = require('winston');


/**
 * @api {get} /api/public/customer Get Customer List
 * @apiVersion 0.2.0
 * @apiName GetCustomerList
 * @apiGroup Customer
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam (Query params) {Number} Offset where start getting customers
 * @apiSuccess (200) {Object[]} data List of the customers
 * @apiSuccess {Number} data.id Id of the customer
 * @apiSuccess {String} data.customername customername the of customer
 * @apiSuccess {Date} data.createdAt Time when customer created
 * @apiSuccess {Object} data.customer_datum Customer data
 * @apiSuccess {String} data.customer_datum.firstname First name of the customer
 * @apiSuccess {String} data.customer_datum.lastname Last name of the customer
 * @apiSuccess {String} data.customer_datum.email Email of the customer
 * @apiSuccess {String} data.customer_datum.telephone Telephone of the customer
 * @apiSuccess {String} data.customer_datum.address Adress of the customer
 * @apiSuccess {String} data.customer_datum.city City
 * @apiSuccess {String} data.customer_datum.country Country
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */
exports.listCustomers = function(req, res) {
    let query = {};
    query.attributes = ['id','username','createdAt'];
    query.where = {company_id: req.token.company_id};
    query.include = [
        {
            model: db.customer_data,
            attributes:['firstname','lastname','email','telephone','address','city','country'],
            required: true
        }
    ];
    query.limit = 100;
    query.raw = true;
    query.order = 'id desc'
    query.raw = true;

    if (req.query.offset) {
        let offset = parseInt(req.query.offset);
        if (offset) {
            query.offset = offset;
        }
    }
    
    db.login_data.findAll(query)
        .then(function(results) {
            if (!results) {
                return res.status(204).send({
                    data: []
                });
            } else {
                res.json({data: results});
            }
        }).catch(function(err) {
            winston.error("Getting list of accounts failed with error: ", err);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        });
}

/**
 * @api {get} /api/public/customer/:username Get Customer
 * @apiVersion 0.2.0
 * @apiName GetCustomer
 * @apiGroup Customer
 * @apiParam (Path parameter) {String} username Username of the user to be updated
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object} data customer
 * @apiSuccess {Number} data.id Id of the customer
 * @apiSuccess {String} data.customername customername the of customer
 * @apiSuccess {Date} data.createdAt Time when customer created
 * @apiSuccess {Object} data.customer_datum Customer data
 * @apiSuccess {String} data.customer_datum.firstname First name of the customer
 * @apiSuccess {String} data.customer_datum.lastname Last name of the customer
 * @apiSuccess {String} data.customer_datum.email Email of the customer
 * @apiSuccess {String} data.customer_datum.telephone Telephone of the customer
 * @apiSuccess {String} data.customer_datum.address Adress of the customer
 * @apiSuccess {String} data.customer_datum.city City
 * @apiSuccess {String} data.customer_datum.country Country
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */
exports.getCustomer = function(req, res) {
    let username = req.params.username
    if (username) {
        db.login_data.find({
            attributes: ['id', 'username', 'createdAt'],
            where: {username: username, company_id: req.token.company_id},
            include: [{
                model: db.customer_data,
                attributes:['firstname','lastname','email','telephone','address','city','country'],
                required: true
            }],
            raw: true
        }).then(function(customer) {
            if (customer) {
                res.send({data: customer});
            } else {
                res.status(404).status(404).send({error: {code: 404, message: 'Customer not found'}});
            }
        }).catch(function(err) {
            winston.error('Getting customer failed with error: ', err);
            res.status(500).send({error: 500, message: 'Internal error'});
        });
    } 
    else {
        res.status(400).send({error: {code: 400, message: 'Parameter username missing'}})
    }
}

/**
 * @api {put} /api/public/customer/:username Update Customer
 * @apiVersion 0.2.0
 * @apiName UpdateCustomer
 * @apiGroup Customer
 * @apiParam (Path parameter) {String} username Username of the user to be updated
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} [firstname] First name of the customer
 * @apiParam {String} [lastname]  Last name of the customer
 * @apiParam {String} [password]  Password of the customer
 * @apiParam {String} [email]  Email of the customer
 * @apiParam {String} [address]  Address of customer
 * @apiParam {String} [city]  City
 * @apiParam {String} [country]  Country
 * @apiParam {String} [telephone] Telephone of the country
 * @apiSuccess (200) {JSON} data Response
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */
exports.updateCustomer = function(req, res) {
    if (req.params.username) {
        if (req.body.username) {
            delete req.body.username;
        }
        
        db.login_data.findOne({
            where:{username: req.params.username}
        }).then(function(login_data) {
            if (!login_data) {
                res.status(404).send({error: {code: 404, message: 'User not found'}});
                return;
            }

            login_data.update(req.body).then(function() {
                db.customer_data.update(req.body, {where: {id: login_data.customer_id}})
                    .then(function(result) {
                        res.send({data: {message: 'Customer updated'}});
                    }).catch(function(error) {
                        winston.error('Update customer failed with error: ', error);
                        res.status(500).send({error: {code: 500, message: 'Internal error'}})
                    });
            })
        }).catch(function(error) {
            winston.error('Database action failed with error: ', error);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        })

    } else {
        res.status(400).send({error: {code: 400, message: 'Parameter username missing'}})
    }
}

/**
 * @api {post} /api/public/customer Create Customer
 * @apiVersion 0.2.0
 * @apiName CreateCustomer
 * @apiGroup Customer
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} firstname First name of the customer
 * @apiParam {String} lastname  Last name of the customer
 * @apiParam {String} username  Username of the customer
 * @apiParam {String} password  Password of the customer
 * @apiParam {String} email  Email of the customer
 * @apiParam {String} address  Address of customer
 * @apiParam {String} city  City
 * @apiParam {String} country  Country
 * @apiParam {String} telephone Telephone of the country
 * @apiSuccess (200) {JSON} data Response
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */
exports.createCustomer = function(req, res) {
    if (!req.body.username || !req.body.email || !req.body.password || !req.body.firstname || !req.body.lastname) {
        return res.status(400).send({error: {code: 400, message: 'Required parameters like username, email, password, firstname, lastname are missing'}});
    }
    req.body.company_id = req.token.company_id; //create customer under this company

    req.body.address = (req.body.address) ? req.body.address : '';
    req.body.city = (req.body.city) ? req.body.city : '';
    req.body.country = req.body.country ? req.body.country : '';
    req.body.telephone = req.body.telephone ? req.body.telephone : '';

    req.body.salt = authenticationHandler.makesalt();
    req.body.channel_stream_source_id = (req.body.channel_stream_source_id) ? req.body.channel_stream_source_id : 1;
    req.body.vod_stream_source = (req.body.vod_stream_source) ? req.body.vod_stream_source : 1;
    req.body.pin = (req.body.pin) ? req.body.pin : 1234;

    db.login_data.findOne({where: {username: req.body.username}}).then(function(customer){
        if (customer) {
            res.status(409).send({error: {code: 409, message: 'User exist'}});
        } else {
            customerFunctions.find_or_create_customer_and_login(req, res)
            .then(function(result) {
                if (result.status) {
                    res.send({data: {message: 'User created successfully'}})
                } else {
                    res.status(500).send({error: {code: 500, message: 'Failed to create user'}})
                }
            }).catch(function(error) {
                winston.error('Create customer failed with error: ' + error)
                res.status(500).send({error: {code: 500, message: 'Internal error'}})
            });
        }
    });
}
