'use strict'

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    saleFunctions = require(path.resolve('./custom_functions/sales.js')),
    winston = require('winston');

/**
 * @api {post} /api/public/subscription Add Subscription
 * @apiVersion 0.2.0
 * @apiName AddSubscription
 * @apiGroup Subscription
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} username Username of the customer
 * @apiParam {String} product_id Product id of that will be subscribed
 * @apiParam {String} type Type can be subscr or vod
 * @apiParam {String} transaction_id Transaction id
 * @apiSuccess (200) {Object} data Response
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */
exports.addSubscription = function (req, res) {
    if (!req.body.username || !req.body.product_id || !req.body.type || !req.body.transaction_id) {
        return res.status(400).send({ error: { code: 400, message: 'Username or product id or type or transaction_id parameter missing' } });
    }

    db.salesreport.findOne({
        where: {transaction_id: req.body.transaction_id}
    }).then(function(sale) {
        if (sale) {
            res.status(409).send({error: {code: 409}, message: 'Transaction is already processed'});
            return;
        }

        db.login_data.findOne({ where: { username: req.body.username } })
        .then(function (customer) {
            if (customer) {
                if (req.body.type == 'subscr') {
                    saleFunctions.add_subscription_transaction(req, res, 1, req.body.transaction_id).then(function (result) {
                        if (result.status) {
                            res.send({ data: {message:result.message}});
                        }
                        else {
                            res.status(409).send({error: {code: 409, message: result.message}});
                        }
                    }).catch(function (err) {
                        winston.error('Adding subscription failed with error: ', err);
                        res.status(500).send({ error: { code: 500, message: 'Internal error' } });
                    });
                } else if (req.body.type == 'vod') {
                    saleFunctions.buy_movie(req, res, req.body.username, req.body.product_id, req.body.transaction_id).then(function (resul) {
                        if (resul.status) {
                            res.send({ data: {message:resul.message}});
                        }
                        else {
                            res.status(409).send({error: {code: 409, message: resul.message}});
                        }
                    }).catch(function (err) {
                        winston.error('Adding vod subscription failed with error: ', err)
                        res.status(500).send({ error: 500, message: 'Internal error' });
                    });
                }
            }
            else {
                res.status(404).send({ error: { code: 404, message: 'User not found' } })
            }
        }).catch(function (err) {
            winston.error('Subscription transaction failed with error: ', err);
            res.status(500).send({ error: { code: 500, message: 'Internal error' } })
        });
    })
}

/**
 * @api {put} /api/public/subscription Cancel Subscription
 * @apiName CancelSubscription
 * @apiGroup Subscription
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiParam {String} transaction_id Transaction id
 * @apiSuccess (200) {Object} data Response
 * @apiSuccess {String} data.message Message
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
*/
exports.cancelSubscription = function (req, res) {
    if (!req.body.transaction_id) {
        return res.status(400).send({ error: { code: 400, message: 'Parameter transection_id  missing' } })
    }

    db.salesreport.findOne({ where: { transaction_id: req.body.transaction_id } })
        .then(function (transaction) {
            if (!transaction) {
                res.status(404).send({ error: { code: 404, message: 'Transaction not found' } })
            }
            else {
                req.body.combo_id = transaction.combo_id;
                db.login_data.findOne({ where: { id: transaction.login_data_id } })
                    .then(function (user) {
                        if (user) {
                            req.body.username = user.username;
                            saleFunctions.add_subscription_transaction(req, res, -1, req.body.transaction_id).then(function (result) {
                                if (result.status) {
                                    res.send({data: {message: result.message}});
                                }
                                else {
                                    res.status(409).send({data: {message: result.message}});
                                }
                            });
                        }
                    });
            }
        })
}
/**
 * @api {get} /api/public/customer/:username/subscription Get User Subscriptions
 * @apiName GetUserSubscriptions
 * @apiGroup Subscription
 * @apiParam (Path parameters) {String} username Username of the customer
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Date} data.start_data Start date
 * @apiSuccess {Date} data.end_date End date
 * @apiSuccess {String} data.package_name Package Name
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 * 
*/
exports.getCustomerSubscriptions = function (req, res) {
    if (!req.params.username) {
        req.status(400).send({ error: { code: 400, message: 'Parameter username missing' } });
        return;
    }

    db.login_data.findOne({ where: { username: req.params.username } })
        .then(function (login_data) {
            if (!login_data) {
                res.status(400).send({ error: { code: 404, message: 'User not found' } });
                return
            }

            db.subscription.findAll({
                attributes: ['start_date', 'end_date'],
                where: { login_id: login_data.id },
                include: [
                    {
                        model: db.package,
                        attributes: ['package_name'],
                        required: true
                    }
                ],
                limit: 100,
                order: 'start_date desc',
                raw: true
            }).then(function (results) {
                if (!results) {
                    res.status(204).send({ data: []});
                    return;
                }

                res.json({data: results});
            }).catch(function (err) {
                winston.error('Getting subscription list failed with error: ', err);
                res.status(500).send({error: {code: 500, message: 'Internal error'}});
            });
        });
}

/**
 * @api {get} /api/public/customer/:username/package Get User Packages
 * @apiName GetUserPackages
 * @apiGroup Subscription
 * @apiParam (Path parameters) {String} username Username of the customer
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Number} data.id Package id
 * @apiSuccess {String} data.package_name Package name
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
*/
exports.getCustomerPackages = function (req, res) {
    db.login_data.findOne({
        where: {username: req.params.username}
    }).then(function (login) {
        if (!login) {
            res.status(404).send({error: {code: 404, message: 'User not found'}});
            return;
        }

        db.package.findAll({
            attributes: ['id', 'package_name'],
            include: [{
                model: db.subscription,
                attributes: [],
                where: {
                    end_date: {
                        $gt: Date.now()
                    },
                    login_id: login.id
                },
                group: ['package_id'],
            }]
        }).then(function (packages) {
            if (!packages) {
                res.status(204).send({ error: { code: 204, message: 'No subscrption found' } });
            }
            else {
                res.send({data: packages})
            }
        }).catch(function(err) {
            winston.error('Getting customer packages failed with error ', err);
        });
    });
}
