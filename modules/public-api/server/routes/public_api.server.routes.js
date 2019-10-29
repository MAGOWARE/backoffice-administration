'use strict'

var path = require('path'),
    customerApiHandler = require(path.resolve('./modules/public-api/server/controllers/customer.server.controller.js')),
    policy = require(path.resolve('./modules/mago/server/policies/mago.server.policy.js')),
    subscriptionApiHandler = require(path.resolve('./modules/public-api/server/controllers/subscription.server.controller.js')),
    epgController = require(path.resolve('./modules/public-api/server/controllers/public.epgdata.server.controller.js')),
    comboApiHandler = require(path.resolve('./modules/public-api/server/controllers/combo.server.controller.js')),
    companyApiHandler = require(path.resolve('./modules/public-api/server/controllers/company.server.controller.js'))

module.exports = function(app) {

    //verify if token is valid.
    /**
     * @api {get} /api/public/verify Verifies if token is valid
     * @apiVersion 0.2.0
     * @apiName Verify Token
     * @apiGroup Login
     * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
     * @apiSuccess {String} data.message Message
     * @apiError {Number} error.code Code
     * @apiError {String} error.message Message description of error
     */
    app.route('/api/public/verify')
        .all(policy.isApiKeyAllowed)
        .get(function (req, res) {
            res.send({message:'success'});
        });

    app.route('/api/public/customer')
        .all(policy.isApiKeyAllowed)
        .get(customerApiHandler.listCustomers)
        .post(customerApiHandler.createCustomer);

    app.route('/api/public/customer/:username')
        .all(policy.isApiKeyAllowed)
        .get(customerApiHandler.getCustomer)
        .put(customerApiHandler.updateCustomer);

    app.route('/api/public/subscription')
        .all(policy.isApiKeyAllowed)
        .post(subscriptionApiHandler.addSubscription)
        .put(subscriptionApiHandler.cancelSubscription);

    app.route("/api/public/customer/:username/subscription")
        .all(policy.isApiKeyAllowed)
        .get(subscriptionApiHandler.getCustomerSubscriptions);

    app.route('/api/public/customer/:username/package')
        .all(policy.isApiKeyAllowed)
        .get(subscriptionApiHandler.getCustomerPackages)

    app.route('/api/public/combo')
        .all(policy.isApiKeyAllowed)
        .get(comboApiHandler.getCombos);
    
    app.route('/api/public/company')
        .all(policy.isApiKeyAllowed)
        .all(policy.isSuperadmin)
        .get(companyApiHandler.getCompanies)
        .post(companyApiHandler.createCompany)

    app.route('/api/public/company/:id')
        .put(companyApiHandler.updateCompany)


    /* ---------------------------------------------- EPG Data ---------------------------------------------- */

    //Insert EPG Row
    app.route('/api/public/epg/insert')
        .all(policy.isApiKeyAllowed)
        .post(epgController.insert_epg_row);

}