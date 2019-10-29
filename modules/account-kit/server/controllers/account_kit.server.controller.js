
var path = require('path'),
    request = require('request'),
    queryString = require('querystring'),
    config = require(path.resolve('./modules/account-kit/server/config')),
    customerFunctions = require(path.resolve('./custom_functions/customer_functions')),
    authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller')),
    response = require(path.resolve("./config/responses.js")),
    db = require(path.resolve('./config/lib/sequelize')).models;
var winston = require('winston');

const crypto = require('crypto');
var csrf = 'qwertzuio';
const me_endpoint_base_url = 'https://graph.accountkit.com/' + config.api_version + '/me';
const token_exchange_base_url = 'https://graph.accountkit.com/' + config.api_version + '/access_token';

exports.handleRenderLoginForm = function(req, res) {
    const address = req.protocol + '://' + req.get('host');
    res.render(path.resolve('modules/account-kit/server/templates/login'), {
        server_address: address
    });
}

exports.handleLoginSuccess = function(req, res) {
    if (req.query.state === csrf && req.query.status === 'PARTIALLY_AUTHENTICATED') {
        var app_access_token = ['AA', config.app_id, config.app_secret].join('|');
        var params = {
          grant_type: 'authorization_code',
          code: req.query.code,
          access_token: app_access_token
        };

        // exchange tokens
        var token_exchange_url = token_exchange_base_url + '?' + queryString.stringify(params);
        request.get({url: token_exchange_url, json: true}, function(err, resp, respBody) {
            if (respBody.access_token) {
                handleAuthSuccess(req, res, respBody.access_token);
            }
            else {
                let r = new response.OK();
                r.status_code = 702;
                r.error_code = -1;
                r.error_description = 'USER_NOT_FOUND';
                res.send(r);
            }
        });
    }
    else if (req.query.access_token) {
        handleAuthSuccess(req, res, req.query.access_token)
    }
    else {
        let r = new response.OK();
        r.status_code=400;
        r.error_code = -1;
        r.error_description = 'BAD_REQUEST'
        res.send(r);
    }
}

function handleAuthSuccess(req, res, access_token) {
    // get account details at /me endpoint
    var me_endpoint_url = me_endpoint_base_url + '?access_token=' + access_token;
    request.get({ url: me_endpoint_url, json: true }, function (err, resp, respBody) {
        let username;
        let isEmail = false;

        if (respBody.phone) {
            username = respBody.phone.number;
            username = username.substring(1, username.length)
        } else if (respBody.email) {
            username = respBody.email.address;
            isEmail = true;
        } else {
            let r = new response.OK();
            r.status_code=702;
            r.error_code = -1;
            r.error_description = 'USER_NOT_FOUND';
            res.send(r);
            return;
        }
        db.login_data.findOne({
            where: { username: username }
        }).then(function (login_data) {
            if (!login_data) {
                //add user
                req.body = {};
                req.body.firstname = '';
                req.body.lastname = '';
                req.body.address = '';
                req.body.city = '';
                req.body.country = '';
                req.body.telephone = isEmail ? '' : respBody.phone.number;

                req.body.email = username;
                req.body.username = username;
                req.body.password = username;

                //  req.body.password = crypto.randomBytes(4).toString('hex').slice(0, 8);

                customerFunctions.create_customer_with_login(req, res)
                    .then(function (result) {
                        if (result.status) {
                            db.login_data.findOne({where: {
                                username: username
                            }}).then(function(login_data){
                                if (login_data) {
                                    let password = authenticationHandler.encryptPassword(username, login_data.salt)
                                    let user = {
                                        'username': username,
                                        'password': password
                                    }
                                    let responseMsg = new response.OK();
                                    responseMsg.extra_data = 'user';
                                    responseMsg.response_object = [user];
                                    res.send(responseMsg);
                                }
                            })
                        } else {
                            let r = new response.OK();
                            r.status_code = 702;
                            r.error_code = -1;
                            r.error_description = 'USER_NOT_FOUND';
                            res.send(r);
                        }
                    }).catch(function (err) {
                    let r = new response.OK();
                    r.status_code = 500;
                    r.error_code = -1;
                    r.error_description = 'Error';
                    res.status(500).send(r);
                });
            }
            else {
                let password = authenticationHandler.encryptPassword(username, login_data.salt);

                let user = {
                    'username': username,
                    'password': password
                }
                let responseMsg = new response.OK();
                responseMsg.extra_data = 'user';
                responseMsg.response_object = [user];

                res.send(responseMsg);
            }
        }).catch(function(error){
            winston.error("Error finding login data at account kit controlller, error: ", error);
        })
    });
}

exports.encrypt = function(req, res) {
    let username = req.query.username;
    let salt = req.query.salt;
    res.send(authenticationHandler.encryptPassword(username, salt));
}