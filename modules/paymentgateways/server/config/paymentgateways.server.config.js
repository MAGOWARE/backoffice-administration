'use strict';

var paymenttokens = {

    "STRIPE":  {
        "API_KEY":        "STRIPE_API_KEY_HERE",
        "ENDPOIN_REFUND": "STRIPE_API_KEY_HERE"
    }
}

/**
 * Module init function.
 */
module.exports = function(app, db) {
    app.locals.paymenttokens = paymenttokens;
};

