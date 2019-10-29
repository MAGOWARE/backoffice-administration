'use strict';
var path = require('path'),
    querystring=require('querystring'),
    therequest = require('request'),
    winston = require(path.resolve('./config/lib/winston'));

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

    var matomourl = 'http://35.205.255.229/piwik.php';
    var thismoment = new Date;

    object_data.idsite = 2; //matomo required
    object_data.rec = 1; //matomo required
    //object_data.send_image=0;

    object_data.token_auth = ''; //matomo required for extra data, todo: implemnt on backend.
    //object_data.token_auth = ''; //matomo required for extra data, todo: implemnt on backend.

    object_data.uid = req.auth_obj.username;        //user ID
    object_data.ua  = req.headers["user-agent"];    //user agent
    object_data.cip = req.ip.replace('::ffff:', '');    // user ip
    object_data.res = req.body.screensize || null; //screen resolution

    object_data.h = thismoment.getHours();
    object_data.m = thismoment.getMinutes();
    object_data.s = thismoment.getSeconds();

    therequest.post(
        matomourl, {
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

    var object_data = {
        //t:'event',

        url:'http://apiv2/events/event',
        action_name : req.body.event_category + "/" + req.body.event_action + "/" + req.body.event_label + "/" + req.body.event_value + "/" + req.body.event_type + "/" + req.body.screen_name + "/" + req.body.program_name + "/" + req.body.player_name + "/" + req.body.stream_resolution + "/" + req.body.stream_bandwidth,

        e_c: req.body.event_category,
        e_a: req.body.event_action,
        e_n: req.body.event_label,
        e_v: parseInt(req.body.event_value) || 1, //req.body.value

        _cvar: JSON.stringify({
            //'1': ['custom variable name', 'custom variable value']
            '1': ['app_name', req.body.app_name],      //application name
            '2': ['app_version', req.body.appversion],    //application version
            '3': ['app_id', req.body.appid]         //application id
            //cd: req.body.screen_name || null, //screen name
            //sr: req.body.screensize
        })
    };

    //add media analytics
    if(req.body.event_category=='channel_change') {


    }

    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });
    //var lang = (languages[req.body.language]) ? req.body.language : 'eng'; //handle missing language variables, serving english as default
    //res.send(languages[lang].language_variables['OK']);
}

exports.trackscreen = function(req, res) {

    var object_data = {
        //an:  req.body.app_name, //application name
        //av:  req.body.appversion, //application version
        //aid: req.body.appid, //application id

        url:'http://apiv2/events/screen',
        action_name : req.body.event_category + "/" + req.body.event_action + "/" + req.body.event_label + "/" + req.body.event_value + "/" + req.body.event_type + "/" + req.body.screen_name + "/" + req.body.program_name + "/" + req.body.player_name + "/" + req.body.stream_resolution + "/" + req.body.stream_bandwidth,
        //ping:1,
        //c_n: req.body.event_label || null, //screen name
        //c_p: req.body.program_name || null, //program name
        //c_i: req.body.event_category || null, //program name
        //sr: req.body.screensize,

        _cvar: JSON.stringify({
            //'1': ['custom variable name', 'custom variable value']
            '1': ['app_name', req.body.app_name],      //application name
            '2': ['app_version', req.body.appversion],    //application version
            '3': ['app_id', req.body.appid]         //application id
            //cd: req.body.screen_name || null, //screen name
            //sr: req.body.screensize
        })
    };
    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });
};

exports.tracktiming = function(req, res) {

    var object_data = {

        url:'http://apiv2/events/timing',
        action_name : req.body.event_category + "/" + req.body.event_action + "/" + req.body.event_label + "/" + req.body.event_value + "/" + req.body.event_type + "/" + req.body.screen_name + "/" + req.body.program_name + "/" + req.body.player_name + "/" + req.body.stream_resolution + "/" + req.body.stream_bandwidth,

        utc: req.body.event_category,  //timing cateogry
        utv: req.body.event_action,    //timing variable
        utl: req.body.event_label,    //timing label
        utt: req.body.event_value,    //timing time
        sr: req.body.screensize,

        _cvar: JSON.stringify({
            //'1': ['custom variable name', 'custom variable value']
            '1': ['app_name', req.body.app_name],      //application name
            '2': ['app_version', req.body.appversion],    //application version
            '3': ['app_id', req.body.appid]         //application id
            //cd: req.body.screen_name || null, //screen name
            //sr: req.body.screensize
        })
    };
    trackobject(object_data, req, function (err) {
        if (err) {winston.error(err)}
    });

};