'use strict';
/**
 * Module dependencies.
 */
var path = require('path'),
    config = require(path.resolve('./config/config')),
    authpolicy = require(path.resolve('./modules/deviceapiv2/server/auth/apiv2.server.auth.js')),
    tokenGenerators = require(path.resolve('./modules/streams/server/controllers/token_generators.server.controller.js')),
    catchupfunctions = require(path.resolve('./modules/streams/server/controllers/catchup_functions.server.controller.js')),
    keyDelivery = require(path.resolve('./modules/streams/server/controllers/streamkeydelivery.server.controller.js')),
    encryptionFunctions = require(path.resolve('./modules/streams/server/controllers/encryption_functions.server.controller.js'));


module.exports = function(app) {

    app.route('/apiv2/token/akamaitokenv2hdnts/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.akamai_token_v2_generator_hdnts)
        .post(tokenGenerators.akamai_token_v2_generator_hdnts);

    app.route('/apiv2/token/akamaitokenv2/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.akamai_token_v2_generator)
        .post(tokenGenerators.akamai_token_v2_generator);

    app.route('/apiv2/token/akamaitokenv2extraquery/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.akamai_token_v2_generator_extraquery)
        .post(tokenGenerators.akamai_token_v2_generator_extraquery);


    app.route('/apiv2/token/catchupakamaitokenv2/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.catchup_akamai_token_v2_generator)
        .post(tokenGenerators.catchup_akamai_token_v2_generator);

    //app.route('/apiv2/token/mobileakamaitokenv2/*')
    //    .all(authpolicy.isAllowed)
    //    .get(tokenGenerators.akamai_token_v2_generator_tibo_mobile)
    //    .post(tokenGenerators.akamai_token_v2_generator_tibo_mobile);

    app.route('/apiv2/token/flussonic/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.flussonic_token_generator)
        .post(tokenGenerators.flussonic_token_generator);

    app.route('/apiv2/token/nimble/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.nimble_token_generator)
        .post(tokenGenerators.nimble_token_generator);

    app.route('/apiv2/token/verizon/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.handleGenerateTokenJson)
        .post(tokenGenerators.handleGenerateTokenJson);
    app.route('/apiv2/drm/nimble')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.nimble_drm_key);

    app.route('/apiv2/catchup/flussonic')
        .all(authpolicy.isAllowed)
        .post(catchupfunctions.flussonic_catchup_stream);

    //generate token for wowza streaming server
    app.route('/apiv2/token/generatewowzatoken/*')
        .all(authpolicy.isAllowed)
        .get(tokenGenerators.wowza_token_generator)
        .post(tokenGenerators.wowza_token_generator);

/*=================== encryption api URLs =================== */

    app.route('/apiv2/encryption/key1')
        //.all(authpolicy.isAllowed)
        .all(encryptionFunctions.free_default_key);


    //streams key delivery
    app.route('/apiv2/generic/getinternalhashtoken')
        .all(authpolicy.isAllowed)
        .all(keyDelivery.generate_internal_hash_token);

    app.route('/apiv2/generic/getinternalkey')
        .get(keyDelivery.generate_internal_key);

};