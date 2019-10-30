'use strict';
const path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    customer_account = require(path.resolve('./modules/mago/server/controllers/CustomerAccount.server.controller'));


module.exports = function(app) {

    /* ===== Customer Account ===== */

    app.route('/api/CustomerAccount')
        .all(policy.Authenticate)
    //.all(policy.isAllowed)
        .post(customer_account.create_customer_with_login);

    /* ===== Customer Account List ===== */
    app.route('/api/CustomerAccount')
        .all(policy.Authenticate)
        .get(customer_account.list);

    app.route('/api/CustomerAccount/:customerId')
        .all(policy.Authenticate)
        .get(customer_account.dataByID);

    app.route('/api/CustomerAccount/:customerId')
        .all(policy.Authenticate)
        .put(customer_account.updateClient);

    // app.param('customerId', customer_account.dataByID);

};