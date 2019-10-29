'use strict'
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    vod = require(path.resolve("./modules/deviceapiv2/server/controllers/vod.server.controller.js")),
    schedule = require(path.resolve("./modules/deviceapiv2/server/controllers/schedule.server.controller.js")),
    winston = require(path.resolve('./config/lib/winston')),
    dateFormat = require('dateformat'),
    moment = require('moment'),
    querystring = require('querystring'),
    async = require('async'),
    http = require('http'),
    models = db.models;

var id = -1;
var upgradetype = 1;
var name = "";
var updatedate = "";
var description = "";
var location = "";
var activated = 0;

/**
 * @api {post} /apiv2/settings/settings /apiv2/settings/settings
 * @apiVersion 0.2.0
 * @apiName GetSettings
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiParam {String} activity {login or livetv or vod} Mandatory value.
 * @apiParam {Number} mainmenutimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} livetvtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} vodtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiDescription Get user settings, subscription, etc
 */

exports.settings = function (req, res) {
    var okresponse = new response.APPLICATION_RESPONSE(req.body.language, 200, 1, 'OK_DESCRIPTION', 'OK_DATA');

    var current_timestamp = Date.now(); //server timestamp in milliseconds
    var client_timestamp = req.auth_obj.timestamp; //request timestamp in milliseconds
    var settings = null;

    async.waterfall([
        //GETTING USER DATA
        function (callback) {
            models.login_data.findOne({
                attributes: ['id', 'player', 'pin', 'show_adult', 'timezone', 'auto_timezone', 'beta_user', 'activity_timeout'],
                where: { username: req.auth_obj.username, company_id: req.thisuser.company_id}
            }).then(function (login_data) {
                callback(null, login_data);
                return null;
            }).catch(function (error) {
                winston.error("Quering the data of this user failed with error: ", error);
            });
        },
        //CHECKING IF THE USER NEEDS TO REFRESH SERVER SIDE DATA
        function (login_data, callback) {
            if (!req.body.livetvtimestamp && !req.body.vodtimestamp && !req.body.mainmenutimestamp) {
                callback(null, login_data, false);
            }
            else {
                if (req.body.activity === 'livetv') {
                    //db value of last livetv refresh is bigger than client last refresh -> return true. Else return false
                    if ((req.body.livetvtimestamp >= parseFloat(req.app.locals.backendsettings[req.thisuser.company_id].livetvlastchange)) && (req.body.livetvtimestamp >= parseFloat(req.thisuser.livetvlastchange))) {
                        callback(null, login_data, false);
                    }
                    else {
                        okresponse.timestamp = req.app.locals.backendsettings[req.thisuser.company_id].livetvlastchange;
                        callback(null, login_data, true);
                    }
                }
                else if (req.body.activity === 'vod') {
                    //db value of last vod refresh is bigger than client last refresh -> return true. Else return false
                    if ((req.body.vodtimestamp >= parseFloat(req.app.locals.backendsettings[req.thisuser.company_id].vodlastchange)) && (req.body.vodtimestamp >= parseFloat(req.thisuser.vodlastchange))) {
                        callback(null, login_data, false);
                    }
                    else {
                        callback(null, login_data, true);
                    }
                }
                else if (req.body.activity === 'login') {
                    //db value of last main menu or livetv refresh is bigger than client last refresh -> return true. Else return false
                    if (req.body.mainmenutimestamp >= parseFloat(req.app.locals.backendsettings[req.thisuser.company_id].menulastchange)) {
                        callback(null, login_data, false);
                    }
                    else {
                        callback(null, login_data, true);
                    }
                }
                else {
                    callback(null, login_data, false); //in case of unexpected activity value, return false
                }
            }
        },
        //GETTING DAYS LEFT, DEPENDING ON THE ACTIVITY OF THE USER
        function (login_data, refresh, callback) {
            var activity = (req.body.activity === 'login') ? 'livetv' : req.body.activity; //login activity requires livetv days_left, other activity require their own days_left
            //sequelize currently does not support non-primary foreign keys, so the code must be broken into two queries
            models.app_group.findOne({
                attributes: ['app_group_id'], where: { app_id: req.auth_obj.appid }
            }).then(function (app_group) {
                models.subscription.findAll({
                    attributes: ['end_date'], where: { login_id: login_data.id }, limit: 1, order: [['end_date', 'DESC']],
                    include: [{
                        model: models.package, required: true, attributes: ['id'], include: [
                            {
                                model: models.package_type, required: true, attributes: ['id'], where: { app_group_id: app_group.app_group_id }, include: [
                                    { model: models.activity, required: true, attributes: ['id'], where: { description: activity } }
                                ]
                            }
                        ]
                    }
                    ]
                }).then(function (enddate) {
                    var end_date = (enddate[0]) ? moment(enddate[0].end_date, "YYYY-M-DD HH:mm:ss") : moment(new Date(), "YYYY-M-DD HH:mm:ss");  //if no subscription found, enddate set as current time to return 0 days left
                    var current_date = moment(new Date(), "YYYY-M-DD HH:mm:ss");
                    var seconds_left = end_date.diff(current_date, 'seconds');
                    //re-evaluating push task for subscription end. All current tasks of this screen size are deleted, a new task is created
                    if (req.auth_obj.appid === '2' || req.auth_obj.appid === '3') {
                        if (livetv_s_subscription_end[req.thisuser.id]) {
                            //destroy push task for live tv small screen for this user
                            clearTimeout(livetv_s_subscription_end[req.thisuser.id]);
                            delete livetv_s_subscription_end[req.thisuser.id];
                        }
                        if (vod_s_subscription_end[req.thisuser.id]) {
                            //destroy push task for vod small screen for this user
                            clearTimeout(vod_s_subscription_end[req.thisuser.id]);
                            delete vod_s_subscription_end[req.thisuser.id];
                        }
                    }
                    else {
                        if (livetv_l_subscription_end[req.thisuser.id]) {
                            //destroy push task for live tv large screen for this user
                            clearTimeout(livetv_l_subscription_end[req.thisuser.id]);
                            delete livetv_l_subscription_end[req.thisuser.id];
                        }
                        if (vod_l_subscription_end[req.thisuser.id]) {
                            //destroy push task for vod large screen for this user
                            clearTimeout(vod_l_subscription_end[req.thisuser.id]);
                            delete vod_l_subscription_end[req.thisuser.id];
                        }
                    }

                    if (seconds_left > 0) {
                        schedule.end_subscription(req.thisuser.id, seconds_left * 1000, [req.auth_obj.appid], req.auth_obj.screensize, req.body.activity, req.app.locals.backendsettings[req.thisuser.company_id].firebase_key); //create push task for the ending of this type of subscription
                    }

                    var daysleft = Math.ceil(Number(Math.ceil(seconds_left / 86400).toFixed(0)));
                    callback(null, login_data, daysleft, seconds_left, refresh);
                    return null;
                }).catch(function (error) {
                    winston.error("Quering for this user's active subscription failed with error: ", error);
                    callback(null, login_data, 0, 0, refresh);
                    return null;
                });
                return null;
            }).catch(function (error) {
                winston.error("Quering for this app group's data failed with error: ", error);
                callback(null, login_data, 0, 0, refresh);
                return null;
            });
        },
        function (login_data, daysleft, seconds_left, refresh, callback) {
            var get_beta_app = (login_data.beta_user) ? [0, 1] : [0];
            //FIND LATEST AVAILABLE UPGRADE FOR THIS APPID, WHOSE API AND APP VERSION REQUIREMENT IS FULFILLED BY THE DEVICE, and status fits the user status

            models.app_management.findOne({
                attributes: ['id', 'title', 'description', 'url', 'isavailable', 'updatedAt'],
                limit: 1,
                where: {
                    beta_version: { in: get_beta_app },
                    appid: req.auth_obj.appid,
                    upgrade_min_api: { lte: req.body.api_version }, //device api version must be greater / equal to min api version of the upgrade
                    upgrade_min_app_version: { lte: req.body.appversion }, //device app version must be greater / equal to min app version of the upgrade
                    app_version: { gt: req.body.appversion }, //device app version must be smaller than the app version of the upgrade
                    isavailable: 1,
                    company_id: req.thisuser.company_id
                },
                order: [['updatedAt', 'DESC']] //last updated record
            }).then(function (result) {
                if (result) {
                    id = result['id'];
                    name = result['title'];
                    updatedate = dateFormat(result['updatedAt'], "yyyy-mm-dd hh:MM:ss:000");
                    description = result['description'];
                    location = req.app.locals.backendsettings[req.thisuser.company_id].assets_url + '' + result['url'];
                    activated = result['isavailable'];
                    callback(null, login_data, daysleft, seconds_left, refresh, true);
                }
                else {
                    callback(null, login_data, daysleft, seconds_left, refresh, false); //if there are no available upgrades, return false
                }
                return null;
            }).catch(function (error) {
                winston.error("Searching for the latest available update for the user failed with error: ", error);
                callback(null, login_data, daysleft, seconds_left, refresh, false);
                return null;
            });
        },
        //get client offset from the ip_timezone service
        function (login_data, daysleft, seconds_left, refresh, available_upgrade, callback) {
            if (req.body.activity === 'login' && req.auth_obj.screensize === 1 && login_data.auto_timezone === true) {
                var client_ip = (req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'].split(',').pop().replace('::ffff:', '').replace(' ', '') : req.ip.replace('::ffff:', '');
                var apiurl = req.app.locals.backendsettings[req.thisuser.company_id].ip_service_url + req.app.locals.backendsettings[req.thisuser.company_id].ip_service_key + '/' + client_ip;

                try {
                    http.get(apiurl, function (resp) {
                        resp.on('data', function (ip_info) {
                            if (JSON.parse(ip_info).gmtOffset !== undefined && isvalidoffset(JSON.parse(ip_info).gmtOffset) !== false) {
                                callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, isvalidoffset(JSON.parse(ip_info).gmtOffset)); //iptimezone calculated only for large screen devices, after login, for autotimezone true
                            }
                            else callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, login_data.timezone); //return client timezone on error
                        });
                    }).on("error", function (e) {
                        callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, login_data.timezone); //return client timezone on error
                    });
                } catch (e) {
                    callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, login_data.timezone); //url or key+service are invalid, return client timezone
                }
            }
            else {
                callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, login_data.timezone); //device does not request timezone from ip
            }
        },
        function (login_data, daysleft, seconds_left, refresh, available_upgrade, offset, callback) {
            var allowed_content = (login_data.show_adult === true) ? [0, 1] : [0];

            models.vod.findAll({
                attributes: ['id'],
                include: [
                    { model: models.vod_stream, required: true, attributes: ['url', 'encryption', 'token', 'stream_format', 'token_url'] },
                    {
                        model: models.vod_vod_categories, required: true, attributes: [],
                        include: [{ model: models.vod_category, required: true, attributes: [], where: { password: { in: allowed_content }, isavailable: true } }]
                    }
                ], where: { pin_protected: { in: allowed_content }, isavailable: true, company_id: req.thisuser.company_id }
            }).then(function (record_count) {
                callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count.length); //return nr of vod records
                return null;
            }).catch(function (error) {
                winston.error("Quering for number of vod items failed with error: ", error);
                callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, 1000); //return nr of vod records
                return null;
            });
        },
        //for vod activity, checks if there is a movie that the user would like to resume. if yes, sends url and position to the application and deletes the record
        function (login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, callback) {
            if (req.body.activity === 'vod') {
                models.vod_resume.findOne({
                    attributes: ['vod_id', 'resume_position'],
                    where: { login_id: login_data.id, device_id: { not: req.auth_obj.boxid } }
                }).then(function (resume_movie) {
                    if (resume_movie) {
                        models.vod_stream.findOne({
                            attributes: ['url'],
                            where: { vod_id: resume_movie.vod_id }
                        }).then(function (movie_url) {
                            vod.delete_resume_movie(login_data.id, resume_movie.vod_id);
                            callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, true, movie_url.url, resume_movie.resume_position); //send resume = true, movie stream and position
                            return null;
                        }).catch(function (error) {
                            winston.error("Quering for the stream of the movie to resume failed with error: ", error);
                            callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, false, 0, 0); //error occurred, send resume = false
                        });
                        return null;
                    }
                    else {
                        callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, false, 0, 0); //no movie to resume was found, send resume = false
                    }
                    return null;
                }).catch(function (error) {
                    winston.error("Searching for the data of the movie that will be resumed failed with error: ", error);
                    callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, false, 0, 0); //error occurred, send resume = false
                });
            }
            else {
                callback(null, login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, false, 0, 0); //activity different from vod, send resume = false
            }
        },
        //RETURNING CLIENT RESPONSE
        function (login_data, daysleft, seconds_left, refresh, available_upgrade, offset, record_count, resume_vod, movie_url, resume_position) {
            //appoint calculated refresh to the right activity, false to others
            var mainmenurefresh = (req.body.activity === 'login') ? refresh : false;
            var vodrefresh = (req.body.activity === 'vod') ? refresh : false;
            var livetvrefresh = (req.body.activity === 'livetv') ? refresh : false;

            //return images based on appid
            var logo_url = (req.auth_obj.screensize === 1) ? req.app.locals.backendsettings[req.thisuser.company_id].box_logo_url : req.app.locals.backendsettings[req.thisuser.company_id].mobile_logo_url;
            var background_url = (req.auth_obj.screensize === 1) ? req.app.locals.backendsettings[req.thisuser.company_id].box_background_url : req.app.locals.backendsettings[req.thisuser.company_id].mobile_background_url;
            var vod_background_url = (req.auth_obj.appid == 1) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_background_url : req.app.locals.backendsettings[req.thisuser.company_id].vod_background_url;

            //days_left message is empty if user still has subscription
            var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
            var days_left_message = (daysleft > 0) ? "" : languages[lang].language_variables['NO_SUBSCRIPTION'];

            var response_data = [{
                "logo_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + logo_url,
                "background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + background_url,
                "vod_background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + vod_background_url,
                "portrait_background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + req.app.locals.backendsettings[req.thisuser.company_id].portrait_background_url,
                "livetvrefresh": livetvrefresh,
                "vodrefresh": vodrefresh,
                "mainmenurefresh": mainmenurefresh,
                "daysleft": daysleft,
                "seconds_left": Math.min(req.app.locals.backendsettings[req.thisuser.company_id].activity_timeout, login_data.activity_timeout, seconds_left),
                "online_payment_url": req.app.locals.backendsettings[req.thisuser.company_id].online_payment_url,
                "days_left_message": days_left_message,
                "record_count": Math.ceil(record_count / req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr),
                "resume_movie": resume_vod,
                "movie_url": movie_url.toString(),
                "resume_position": resume_position,
                "company_url": req.app.locals.backendsettings[req.thisuser.company_id].company_url,
                "log_event_interval": req.app.locals.backendsettings[req.thisuser.company_id].log_event_interval,
                "channel_log_time": req.app.locals.backendsettings[req.thisuser.company_id].channel_log_time,
                "activity_timeout": Math.min(req.app.locals.backendsettings[req.thisuser.company_id].activity_timeout, login_data.activity_timeout),
                "player": login_data.player,
                "pin": login_data.pin,
                "showadult": login_data.show_adult,
                "timezone": login_data.timezone,
                "auto_timezone": login_data.auto_timezone,
                "iptimezone": offset,
                "available_upgrade": available_upgrade,
                "get_ads": (req.thisuser.get_ads && (req.thisuser.get_ads === true)) ? 1 : 0,
                "vast_ad_url": (req.app.locals.backendsettings[req.thisuser.company_id].vast_ad_url)
            }];

            response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
        }
    ], function (err) {

        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};





//API GETS APPID, APP VERSION AND API VERSION OF THE DEVICE AND DECIDES IF THERE ARE ANY UPGRADES WHOSE REQUIREMENTS ARE FULLFILL BY THIS DEVICE
exports.upgrade = function (req, res) {
    res.setHeader('cache-control', '');
    if (id >= 0) {
        var response_data = [{
            "id": id,
            "upgradetype": upgradetype,
            "name": name,
            "updatedate": updatedate,
            "description": description,
            "location": location,
            "activated": activated
        }];
        response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
    }
    else {
        response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'NO_UPGRADES', 'private,max-age=86400');
    }
};


/**
 * @api {get} /help_support Help and support page
 * @apiVersion 0.2.0
 * @apiName Help and support page
 * @apiGroup DeviceAPI
 * @apiHeader {--} -- --
 * @apiSuccess (200) {webpage} message Help page set in the management system, default help page otherwise
 * @apiError (40x) {--} -- --
 *

 */
exports.help_support = function (req, res) {
    //If settings.help_page is not a valid column in the settings table or if the value is left empty, returns the default support page
    //Otherwise returns the page defined in the management system
    var company_id = (req.thisuser) ? req.thisuser.company_id : 1; //If the request comes from a verified user, return id of the user's company. If the user is unknown, return the default id.
    var support_page = (!req.app.locals.backendsettings[company_id].help_page || req.app.locals.backendsettings[company_id].help_page.length < 1) ? '/help_and_support' : req.app.locals.backendsettings[company_id].help_page;
    res.redirect(support_page);
};


function isvalidoffset(offset) {

    //offset is number
    if (typeof offset === 'number') {
        //offset is in range -12 : 12
        if (-12 < offset < 12) {
            if (Math.floor(offset) === offset && Math.ceil(offset) === offset) {
                return parseInt(offset); //valid offset. parseInt makes sure any decimal zeros are removed
            }
            else return false; //offset was double, so invalid
        }
        else return false; //offset out of range, so invalid
    }
    else return false; //offset of invalid datatype, so invalid
}





/**
 * @api {get} /apiv2/settings/settings/:username /apiv2/settings/settings/
 * @apiVersion 0.2.0
 * @apiName GetSettings
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiParam {String} activity {login or livetv or vod} Mandatory value.
 * @apiParam {Number} mainmenutimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} livetvtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiParam {Number} vodtimestamp Timestamp in milliseconds, mandatory value coming from frontend
 * @apiDescription Get user settings, subscription, etc
 */

exports.get_settings = function (req, res) {

    var login_data = req.thisuser;
    var activity = 'livetv';
    var iptimeoffset = req.app.locals.timezones[req.geoip.timezone];
    let thisreqheaders = querystring.parse(req.get("auth"),",",":");
    var get_beta_app = (req.thisuser.beta_user) ? [0, 1] : [0];


    models.subscription.findAll({
        attributes: ['end_date'], where: { login_id: login_data.id }, limit: 1, order: [['end_date', 'DESC']],
        include: [{
            model: models.package, required: true, attributes: ['id'],
            include: [
                        {
                        model: models.package_type, required: true, attributes: ['id'], where: { app_group_id: req.auth_obj.screensize },
                        include: [
                                    { model: models.activity, required: true, attributes: ['id'], where: { description: activity } }
                                ]
                        }
                   ]
                }
        ]
    }).then(function (enddate) {
        //res.send(enddate);
        var end_date = (enddate[0]) ? moment(enddate[0].end_date, "YYYY-M-DD HH:mm:ss") : moment(new Date(), "YYYY-M-DD HH:mm:ss");  //if no subscription found, enddate set as current time to return 0 days left
        var current_date = moment(new Date(), "YYYY-M-DD HH:mm:ss");
        var seconds_left = end_date.diff(current_date, 'seconds');

        //re-evaluating push task for subscription end. All current tasks of this screen size are deleted, a new task is created

        if (req.auth_obj.appid === '2' || req.auth_obj.appid === '3') {
            if (livetv_s_subscription_end[req.thisuser.id]) {
                //destroy push task for live tv small screen for this user
                clearTimeout(livetv_s_subscription_end[req.thisuser.id]);
                delete livetv_s_subscription_end[req.thisuser.id];
            }
            if (vod_s_subscription_end[req.thisuser.id]) {
                //destroy push task for vod small screen for this user
                clearTimeout(vod_s_subscription_end[req.thisuser.id]);
                delete vod_s_subscription_end[req.thisuser.id];
            }
        }
        else {
            if (livetv_l_subscription_end[req.thisuser.id]) {
                //destroy push task for live tv large screen for this user
                clearTimeout(livetv_l_subscription_end[req.thisuser.id]);
                delete livetv_l_subscription_end[req.thisuser.id];
            }
            if (vod_l_subscription_end[req.thisuser.id]) {
                //destroy push task for vod large screen for this user
                clearTimeout(vod_l_subscription_end[req.thisuser.id]);
                delete vod_l_subscription_end[req.thisuser.id];
            }
        }

        if (seconds_left > 0) {
            schedule.end_subscription(req.thisuser.id, seconds_left * 1000, [req.auth_obj.appid], req.auth_obj.screensize, req.body.activity, req.app.locals.backendsettings[req.thisuser.company_id].firebase_key); //create push task for the ending of this type of subscription
        }

        var daysleft = Math.ceil(Number(Math.ceil(seconds_left / 86400).toFixed(0)));

        var mainmenurefresh = (req.body.activity === 'login') ? refresh : false;
        var vodrefresh = (req.body.activity === 'vod') ? refresh : false;
        var livetvrefresh = (req.body.activity === 'livetv') ? refresh : false;

        //return images based on appid
        var logo_url = (req.auth_obj.screensize === 1) ? req.app.locals.backendsettings[req.thisuser.company_id].box_logo_url : req.app.locals.backendsettings[req.thisuser.company_id].mobile_logo_url;
        var background_url = (req.auth_obj.screensize === 1) ? req.app.locals.backendsettings[req.thisuser.company_id].box_background_url : req.app.locals.backendsettings[req.thisuser.company_id].mobile_background_url;
        var vod_background_url = (req.auth_obj.appid == 1) ? req.app.locals.backendsettings[req.thisuser.company_id].vod_background_url : req.app.locals.backendsettings[req.thisuser.company_id].vod_background_url;

        //days_left message is empty if user still has subscription
        var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
        var days_left_message = (daysleft > 0) ? "" : languages[lang].language_variables['NO_SUBSCRIPTION'];

        var response_data = [{
            'int': process.env.NODE_APP_INSTANCE,
            "logo_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + logo_url,
            "background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + background_url,
            "vod_background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + "" + vod_background_url,
            "portrait_background_url": req.app.locals.backendsettings[req.thisuser.company_id].assets_url + req.app.locals.backendsettings[req.thisuser.company_id].portrait_background_url,
            "livetvrefresh": livetvrefresh,
            "vodrefresh": vodrefresh,
            "mainmenurefresh": mainmenurefresh,
            "daysleft": daysleft,
            "seconds_left": Math.min(req.app.locals.backendsettings[req.thisuser.company_id].activity_timeout, login_data.activity_timeout, seconds_left),
            "online_payment_url": req.app.locals.backendsettings[req.thisuser.company_id].online_payment_url,
            "days_left_message": days_left_message,
            //"record_count": Math.ceil(record_count / req.app.locals.backendsettings[req.thisuser.company_id].vod_subset_nr),
            //"resume_movie": resume_vod,
            //"movie_url": movie_url.toString(),
            //"resume_position": resume_position,
            "company_url": req.app.locals.backendsettings[req.thisuser.company_id].company_url,
            "log_event_interval": req.app.locals.backendsettings[req.thisuser.company_id].log_event_interval,
            "channel_log_time": req.app.locals.backendsettings[req.thisuser.company_id].channel_log_time,
            "activity_timeout": Math.min(req.app.locals.backendsettings[req.thisuser.company_id].activity_timeout, login_data.activity_timeout),
            "player": login_data.player,
            "pin": login_data.pin,
            "showadult": login_data.show_adult,
            "timezone": login_data.timezone,
            "auto_timezone": login_data.auto_timezone,
            "iptimezone": parseInt(iptimeoffset) / 60,
            "available_upgrade": false,
            "get_ads": (req.thisuser.get_ads && (req.thisuser.get_ads === true)) ? 1 : 0,
            "vast_ad_url": (req.app.locals.backendsettings[req.thisuser.company_id].vast_ad_url)
        }];




        models.app_management.findOne({
            attributes: ['id', 'title', 'description', 'url', 'isavailable', 'updatedAt'],
            limit: 1,
            where: {
                beta_version: { in: get_beta_app },
                appid: req.auth_obj.appid,
                upgrade_min_api: { lte: req.get("api_version") }, //device api version must be greater / equal to min api version of the upgrade
                upgrade_min_app_version: { lte: req.get("appversion") }, //device app version must be greater / equal to min app version of the upgrade
                app_version: { gt: req.get("appversion") }, //device app version must be smaller than the app version of the upgrade
                isavailable: 1,
                company_id: req.thisuser.company_id
            },
            order: [['updatedAt', 'DESC']] //last updated record
        }).then(function (result) {
            if (result) {
                id = result['id'];
                name = result['title'];
                updatedate = dateFormat(result['updatedAt'], "yyyy-mm-dd hh:MM:ss:000");
                description = result['description'];
                location = req.app.locals.backendsettings[req.thisuser.company_id].assets_url + '' + result['url'];
                activated = result['isavailable'];
                response_data[0].available_upgrade = true;
                response.send_res_get(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
            }
            else {
                //no upgrade condition found.
                response_data[0].available_upgrade = false;
                response.send_res_get(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
            }
            return null;
        }).catch(function (error) {
            winston.error("Searching for the latest available update for the user failed with error: ", error);
            response.send_res_get(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
            return null;
        });

        return null;

    }).catch(function (error) {
        winston.error("Searching for the user's subscription failed with error: ", error);
        res.send(error);
    });
};
