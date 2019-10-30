'use strict';

var passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    loginData = require(path.resolve('./modules/mago/server/controllers/login_data.server.controller'));



module.exports = function(app) {
    //dashboard
    app.route('/api/dash/logins')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(loginData.latest);

    /* ===== login data ===== */
    app.route('/api/logindata')
        .all(policy.Authenticate)
        .get(loginData.list);

    app.route('/api/logindata')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(loginData.create);

    app.route('/api/logindata/:loginDataId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(loginData.dataByID)
        .put(loginData.update);
        //.delete(loginData.delete);


    /* =====Resellers login data ===== */
    app.route('/api/ResellersLoginData')
        .all(policy.Authenticate)
        .get(loginData.list);

    app.route('/api/ResellersLoginData')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .post(loginData.create);

    app.route('/api/ResellersLoginData/:ResellersLoginDataId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(loginData.read)
        .put(loginData.update)
    //.delete(loginData.delete);

    app.param('ResellersLoginDataId', loginData.dataByID);

};
