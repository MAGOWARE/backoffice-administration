'use strict';
var path = require('path'),
    querystring=require('querystring'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston')),
    therequest = require('request'),
    vod = require(path.resolve("./modules/deviceapiv2/server/controllers/vod.server.controller.js"));


function getlogtime(){
    var d = new Date();
    return d.getDate() + "-" + d.getMonth() + "-"+ d.getFullYear()+" "+ d.getHours()+":"+ d.getMinutes()+":"+ d.getSeconds();
}

//get ipv4 from ipv6
function getipaddress(theip){
    theip = theip.split(":");
    return theip[3];
}

function trackobject(object_data,req, cb) {
    const company_id = req.get("company_id") || 1;

    object_data.v = 1;
    object_data.tid = req.app.locals.backendsettings[company_id].analytics_id; //analytics ID
    object_data.ua  = req.headers["user-agent"];    //user agent
    object_data.cid = req.auth_obj.username;        //user ID
    object_data.uip = req.ip.replace('::ffff:', '');    // user ip
    object_data.sr  = req.body.screensize || null; //screen resolution

    therequest.post(
        'https://www.google-analytics.com/collect', {
            form: object_data
        },
        function(err, response) {
            if (err) { return cb(err); }
            if (response.statusCode !== 200) {
                return cb(new Error('Tracking failed'));
            }
            cb();
        }
    );
}

exports.trackevent = function(req, res) {
    res.setHeader('cache-control', 'no-store');
    if(req.body.event_category === 'vod' && req.body.event_action === 'movie start') vod.add_click(req.body.event_label); //increment clicks for a movie everythime it plays

    winston.info("Analytics request;"+req.method+";"+req.baseUrl+";"+querystring.stringify(req.body));
    var object_data = {
        t:'event',
        ec: req.body.event_category,
        ea: req.body.event_action,
        el: req.body.event_label,
        ev: parseInt(req.body.event_value) || 1, //req.body.value

        //app values
        an: req.body.app_name,      //application name
        av: req.body.appversion,    //application version
        aid:req.body.appid,         //application id
        cd: req.body.screen_name || null, //screen name
        sr: req.body.screensize
    };

    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });
    var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
    //res.send(languages[lang].language_variables['OK']);
};

exports.trackscreen = function(req, res) {
    res.setHeader('cache-control', 'no-store');
    var object_data = {
        t:'screenview',
        an:  req.body.app_name, //application name
        av:  req.body.appversion, //application version
        aid: req.body.appid, //application id
        cd:  req.body.screen_name || null, //screen name
        sr: req.body.screensize,

        //screen resolution & bandwidht
        cd1: req.body.stream_resolution || 'unknown',
        cm1: req.body.stream_bandwidth * 1
    };

    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });
    var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
    //res.send(languages[lang].language_variables['OK']);
};

exports.tracktiming = function(req, res) {
    res.setHeader('cache-control', 'no-store');
    var object_data = {
        t:'timing',
        utc: req.body.event_category,  //timing cateogry
        utv: req.body.event_action,    //timing variable
        utl: req.body.event_label,    //timing label
        utt: req.body.event_value,    //timing time
        sr: req.body.screensize

    };
    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });

    var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
   // res.send(languages[lang].language_variables['OK']);
};
