'use strict';
/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  deviceauthpolicy = require(path.resolve('./modules/deviceapiv2/server/auth/apiv2.server.auth.js')),
  backendwuthpolicy = require(path.resolve('./modules/mago/server/policies/mago.server.policy.js')),
  policy = require(path.resolve('./modules/mago/server/policies/mago.server.policy')),
  paymentGatewaysPolicy = require(path.resolve('./modules/paymentgateways/server/whitelist/paymentgateways.server.whitelist.js')),
  stripeFunctions = require(path.resolve('./modules/paymentgateways/server/controllers/stripe_functions.server.controller.js')),
  paypalCheckout = require('../controllers/paypal_checkout.server.controller');


module.exports = function(app) {

    //get stripe key
    app.route('/apiv2/payments/stripe/getkey')
      .all(paymentGatewaysPolicy.stripe_isAllowed)
      .get(stripeFunctions.stripe_get_key);

    //stripe one off charge
    app.route('/apiv2/payments/stripe/charge')
    // .all(paymentGatewaysPolicy.stripe_isAllowed)
      .post(stripeFunctions.stripe_one_off_charge);

    //stripe subscribe to plan
    app.route('/apiv2/payments/stripe/subscribe')
      .all(paymentGatewaysPolicy.stripe_isAllowed)
      .post(stripeFunctions.stripe_subscription_charge);

    app.route('/apiv2/payments/stripe/ordercharge')
      .all(paymentGatewaysPolicy.stripe_isAllowed)
      .post(stripeFunctions.stripe_order_charge);

    app.route('/apiv2/payments/stripe/addsubscription')
      .all(paymentGatewaysPolicy.stripe_isAllowed)
      .post(stripeFunctions.stripe_add_subscription);

    app.route('/apiv2/payments/stripe/refund')
      .all(paymentGatewaysPolicy.stripe_isAllowed)
      .post(stripeFunctions.stripe_refund);

    app.route('/apiv2/payments/stripe/form/:vod_id/:client_username/:company_id')
    // .all(paymentGatewaysPolicy.stripe_isAllowed)
      .get(stripeFunctions.render_payment_form);


    app.route('/apiv2/payments/paypal/')
      .all(paypalCheckout.renderForm);

    app.route('/apiv2/payments/paypal/webhook')
      .all(policy.isApiKeyAllowed)
      .post(paypalCheckout.handleIPN);
};