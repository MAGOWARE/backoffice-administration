'use strict';
/**
 * Module dependencies.
 */
var path = require('path'),
    config = require(path.resolve('./config/config')),
    authpolicy = require('../auth/apiv2.server.auth.js'),
    authpolicy_v3 = require('../auth/apiv3.server.auth.js'),
    credentialsController = require(path.resolve('./modules/deviceapiv2/server/controllers/credentials.server.controller')),
    channelsController = require(path.resolve('./modules/deviceapiv2/server/controllers/channels.server.controller')),
    catchupController = require(path.resolve('./modules/deviceapiv2/server/controllers/catchup.server.controller')),
    //vodController = require(path.resolve('./modules/deviceapiv2/server/controllers/vod.server.controller')),
    settingsController = require(path.resolve('./modules/deviceapiv2/server/controllers/settings.server.controller')),
    networkController = require(path.resolve('./modules/deviceapiv2/server/controllers/network.server.controller')),
    //eventlogsController = require(path.resolve('./modules/deviceapiv2/server/controllers/eventlogs.server.controller')),
    passwordController = require(path.resolve('./modules/deviceapiv2/server/controllers/password.server.controller')),
    mainController = require(path.resolve('./modules/deviceapiv2/server/controllers/main.server.controller')),
    customersAppController = require(path.resolve('./modules/deviceapiv2/server/controllers/customers_app.server.controller')),
    productsAppController = require(path.resolve('./modules/deviceapiv2/server/controllers/products.server.controller')),
	sitesController = require(path.resolve('./modules/deviceapiv2/server/controllers/sites.server.controller')),
	headerController = require(path.resolve('./modules/deviceapiv2/server/controllers/header.server.controller')),
    deviceepgController = require(path.resolve('./modules/deviceapiv2/server/controllers/deviceepg.server.controller')),
    thisrequestController = require(path.resolve('./modules/deviceapiv2/server/controllers/_this_request.server.controller')),
    geoipLogic = require(path.resolve('./modules/geoip/server/controllers/geoip_logic.server.controller')),
    cache = require('apicache'),
    winston = require(path.resolve('./config/lib/winston'));

module.exports = function(app) {

    app.use('/apiv2',function (req, res, next) {
        winston.info(req.ip.replace('::ffff:', '') + ' # ' + req.originalUrl +' # '+ JSON.stringify(req.body));
        //commented because everything is handled on global security config
		//res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    /* ===== company list ===== */
    app.route('/apiv2/credentials/company_list')
        .all(authpolicy.isAuthTokenValid)
        .post(credentialsController.company_list);


    /* ===== login data credentials===== */
    app.route('/apiv2/credentials/login')
        .all(authpolicy.plainAuth)
        .all(authpolicy.isAllowed)
        .post(credentialsController.loginv2);

    /* ===== login data credentials===== */
    app.route('/apiv2/credentials/login_account_kit')
        .all(authpolicy_v3.plainAuth)
        .all(authpolicy_v3.isAllowed)
        .post(credentialsController.loginv2);

    app.route('/apiv2/credentials/logout')
        .all(authpolicy.isAllowed)
        .post(credentialsController.logout);

    app.route('/apiv2/credentials/logout_user')
        .all(authpolicy.plainAuth)
        .all(authpolicy.isAllowed)
        .post(credentialsController.logout_user);

    //channels
    app.route('/apiv2/channels/list')
        .all(authpolicy.isAllowed)
        .get(channelsController.list_get)
        .post(channelsController.list);

    app.route('/apiv2/channels/genre')
        .all(authpolicy.isAllowed)
        .get(channelsController.genre_get)
        .post(channelsController.genre);

    app.route('/apiv2/channels/epg')
        .all(authpolicy.isAllowed)
        .get(deviceepgController.get_epg)
        .post(deviceepgController.epg);

    app.route('/apiv2/channels/event')
        .all(authpolicy.isAllowed)
        .get(deviceepgController.get_event)
        .post(deviceepgController.event);

    app.route('/apiv2/channels/event/:channelId')
      .all(authpolicy.isAllowed)
      .get(deviceepgController.event_get);

    app.route('/apiv2/channels/daily_epg')
        .all(authpolicy.isAllowed)
        .get(deviceepgController.get_daily_epg)
        .post(deviceepgController.daily_epg);

    app.route('/apiv2/channels/current_epgs')
        .all(authpolicy.isAllowed)
        .get(deviceepgController.get_current_epgs)
        .post(deviceepgController.current_epgs);

    app.route('/apiv2/channels/favorites')
        .all(authpolicy.isAllowed)
        .post(channelsController.favorites);


    app.route('/apiv2/channels/program_info')
        .all(authpolicy.isAllowed)
        .post(channelsController.program_info);
    app.route('/apiv2/channels/schedule')
        .all(authpolicy.isAllowed)
        .post(channelsController.schedule);


    app.route('/apiv2/channels/catchup_events')
        .all(authpolicy.isAllowed)
        .get(catchupController.get_catchup_events)
        .post(catchupController.catchup_events);

    app.route('/apiv2/channels/catchup_stream')
        .all(authpolicy.isAllowed)
        .post(catchupController.catchup_stream);


    //settings
    app.route('/apiv2/settings/settings')
        .all(authpolicy.isAllowed)
        .all(geoipLogic.middleware)
        .post(settingsController.settings)
        .get(settingsController.get_settings);

    app.route('/apiv2/settings/upgrade')
        .all(authpolicy.isAllowed)
        .post(settingsController.upgrade);

    app.route('/help_support')
        .get(settingsController.help_support);
    app.route('/apiv2/help_support')
        .get(settingsController.help_support);

    //main device menu
    app.route('/apiv2/main/device_menu')
        .all(authpolicy.isAllowed)
        .get(mainController.device_menu_get)
        .post(mainController.device_menu);

    //main device menu with two levels - level1
    app.route('/apiv2/main/device_menu_levelone')
        .all(authpolicy.isAllowed)
        .get(mainController.get_devicemenu_levelone);

    //main device menu with two levels - level2
    app.route('/apiv2/main/device_menu_leveltwo')
        .all(authpolicy.isAllowed)
        .get(mainController.get_devicemenu_leveltwo);


    /*******************************************************************
                         Network - related API
     *******************************************************************/
    app.route('/apiv2/network/dbtest')
        .all(authpolicy.isAllowed)
        .post(networkController.dbtest);

    app.route('/apiv2/network/gcm')
        .all(authpolicy.plainAuth) //gcm request may not contain username and password, when called before login
        .all(authpolicy.emptyCredentials) //gcm request may be plaintext, when called before login
        .all(authpolicy.isAllowed)
        .post(networkController.gcm);

    app.route('/apiv2/command/response')
        .all(authpolicy.isAllowed)
        .post(networkController.command_response);

    /*******************************************************************
     User personal data for application
     *******************************************************************/
    app.route('/apiv2/customer_app/settings')
        .all(authpolicy.isAllowed)
        .get(customersAppController.user_settings_get)
        .post(customersAppController.user_settings);

    app.route('/apiv2/customer_app/user_data')
        .all(authpolicy.isAllowed)
        .get(customersAppController.user_data_get)
        .post(customersAppController.user_data);

    app.route('/apiv2/customer_app/update_user_data')
        .all(authpolicy.isAllowed)
        .post(customersAppController.update_user_data);

    app.route('/apiv2/customer_app/update_user_settings')
        .all(authpolicy.isAllowed)
        .post(customersAppController.update_user_settings);

    app.route('/apiv2/customer_app/change_password')
        .all(authpolicy.isAllowed)
        .post(customersAppController.change_password);
    app.route('/apiv2/customer_app/reset_pin')
        .all(authpolicy.isAllowed)
        .post(customersAppController.reset_pin);

    app.route('/apiv2/customer_app/salereport')
        .all(authpolicy.isAllowed)
        .get(customersAppController.salereport_get)
        .post(customersAppController.salereport);

    app.route('/apiv2/customer_app/subscription')
        .all(authpolicy.isAllowed)
        .get(customersAppController.subscription_get)
        .post(customersAppController.subscription);

    app.route('/apiv2/customer_app/genre')
        .all(authpolicy.isAllowed)
        .get(customersAppController.genre_get)
        .post(customersAppController.genre);

    app.route('/apiv2/customer_app/channel_list')
        .all(authpolicy.isAllowed)
        .get(customersAppController.channel_list_get)
        .post(customersAppController.channel_list);

    app.route('/apiv2/customer_app/add_channel')
        .all(authpolicy.isAllowed)
        .post(customersAppController.add_channel);
    app.route('/apiv2/customer_app/delete_channel')
        .all(authpolicy.isAllowed)
        .post(customersAppController.delete_channel);
    app.route('/apiv2/customer_app/edit_channel')
        .all(authpolicy.isAllowed)
        .post(customersAppController.edit_channel);


    /*******************************************************************
     Sale and product management for the application
     *******************************************************************/
    app.route('/apiv2/products/product_list')
        .all(authpolicy.isAllowed)
        .get(productsAppController.product_list_get)
        .post(productsAppController.product_list);


    /* ===== websites ===== */
    //todo: only one of the paths is in use
    app.route('/apiv2/sites_web/registration')
        .all(authpolicy.plainAuth)
        .all(authpolicy.emptyCredentials)
        .post(sitesController.createAccountV2);
    app.route('/apiv2/sites/registration')
        .all(authpolicy.plainAuth)
        .all(authpolicy.emptyCredentials)
        .post(sitesController.createAccountV2);


    app.route('/apiv2/sites/confirm-account/:token')
        .get(sitesController.confirmNewAccountToken);


    /* ===== header logs ===== */
    app.route('/apiv2/header/header')
        .all(authpolicy.isAllowed)
        .get(headerController.header);

    /* ===== login data reset password ===== */
    app.route('/apiv2/password/forgot')
        .post(passwordController.forgot);

    app.route('/apiv2/password/reset/:token')
        .get(passwordController.validateResetToken);



    //****************************************************************
    app.route('/apiv2/channels/testepgdata')
        .get(deviceepgController.test_get_epg_data)

    app.route('/apiv2/channels/epgdata')
        .all(authpolicy.isAllowed)
        .all(cache.middleware('3 minutes'))
        .get(deviceepgController.get_epg_data)

    /* ===== weather widget ===== */

    app.route('/apiv2/weather_widget')
        .all(authpolicy.isAllowed)
        .get(mainController.get_weather_widget);

    /* ===== WELCOME MESSAGE ===== */
    app.route('/apiv2/welcomeMessage')
        .all(authpolicy.isAllowed)
        .get(mainController.get_welcomeMessage);

    /* ===== QR CODE ===== */
    app.route('/apiv2/qrcode')
        // .all(authpolicy.isAllowed)
        .post(mainController.get_qrCode);

    //LOGIN FORM TEMPLATE
    app.route('/apiv2/htmlContent/remotedeviceloginform')
     // .all(authpolicy.isAllowed)
        .get(mainController.getloginform);

    app.route('/apiv2/remotedevicelogin')
        .post(mainController.qr_login);

};
