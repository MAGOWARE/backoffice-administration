'use strict';
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    Sequelize = require('sequelize'),
    db_funct = require(path.resolve("./custom_functions/sequelize_functions.js")),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston')),
    dateFormat = require('dateformat'),
    moment = require('moment'),
    async = require('async'),
    schedule = require(path.resolve("./modules/deviceapiv2/server/controllers/schedule.server.controller.js")),
    models = db.models;


//RETURNS 12 hours of future Epg for a given channel
/**
 * @api {POST} /apiv2/channels/event Channels - 12 hour epg
 * @apiName livetv_12hour_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {Number} channelNumber Channel numbers.
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name",
 *          "id": 1, //-1 for default epgs
 *          "number": 100, //channel number
 *          "title": "event title",
 *          "scheduled": true, //values true/false
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *       }, ....
 *       ]
 *   }
 */
exports.event =  function(req, res) {
    var client_timezone = req.body.device_timezone; //offset of the client will be added to time - related info
    var current_human_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate
    var interval_end_human = dateFormat((Date.now() + 43200000), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate, in the interval of 12 hours
    var channel_title = '';

    models.channels.findOne({
        attributes: ['title'],
        where: {channel_number: req.body.channelNumber, company_id: req.thisuser.company_id}
    }).then(function (thischannel) {
        if(thischannel) channel_title = thischannel.title;
        models.my_channels.findOne({
            attributes: ['title'],
            where: {channel_number: req.body.channelNumber, company_id: req.thisuser.company_id}
        }).then(function (user_channel) {
            if(user_channel) channel_title = user_channel.title;
            models.epg_data.findAll({
                attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
                order: [['program_start', 'ASC']],
                limit: 6,
                include: [
                    {
                        model: models.channels, required: true, attributes: ['title', 'channel_number'],
                        where: {channel_number: req.body.channelNumber} //limit data only for this channel
                    },
                    {model: models.program_schedule,
                        required: false, //left join
                        attributes: ['id'],
                        where: {login_id: req.thisuser.id}
                    }
                ],
                where: Sequelize.and(
                    {program_start: {lte: interval_end_human}, company_id: req.thisuser.company_id},
                    Sequelize.or(
                        Sequelize.and(
                            {program_start:{lte:current_human_time}},
                            {program_end:{gte:current_human_time}}
                        ),
                        Sequelize.and(
                            {program_start: {gte:current_human_time}},
                            {program_end:{lte:interval_end_human}}
                        )
                    )
                )
            }).then(function (result) {
                var raw_result = [];
                var default_programs = [];
                //flatten nested json array
                result.forEach(function(obj){
                    var raw_obj = {};

                    Object.keys(obj.toJSON()).forEach(function(k) {
                        if (typeof obj[k] == 'object') {
                            Object.keys(obj[k]).forEach(function(j) {
                                var programstart = parseInt(obj.program_start.getTime()) +  parseInt((client_timezone) * 3600000);
                                var programend = parseInt(obj.program_end.getTime()) +  parseInt((client_timezone) * 3600000);

                                raw_obj.channelName = obj[k].title;
                                raw_obj.id = obj.id;
                                raw_obj.number = obj[k].channel_number;
                                raw_obj.title = obj.title;
                                raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id);
                                raw_obj.description = obj.long_description;
                                raw_obj.shortname = obj.short_description;
                                raw_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                                raw_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                                raw_obj.duration = obj.duration_seconds;
                                raw_obj.progress = Math.round((Date.now() - obj.program_start.getTime() ) * 100 / (obj.program_end.getTime() - obj.program_start.getTime()));
                            });
                        }
                    });
                    raw_result.push(raw_obj);
                });

                if(result.length <6){
                    for(var i=0; i<6-result.length; i++){
                        var temp_obj = {};
                        temp_obj.channelName = channel_title;
                        temp_obj.id = -1;
                        temp_obj.number = req.body.channelNumber;
                        temp_obj.title = "Program of "+channel_title;
                        temp_obj.scheduled = false;
                        temp_obj.description = "Program of "+channel_title;
                        temp_obj.shortname = "Program of "+channel_title;
                        temp_obj.programstart = '01/01/1970 00:00:00';
                        temp_obj.programend = '01/01/1970 00:00:00';
                        temp_obj.duration = 0;
                        temp_obj.progress = 0;
                        raw_result.push(temp_obj);
                    }
                }
                response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
            }).catch(function(error) {
                winston.error("Getting the next 6 events failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
            return null;
        }).catch(function(error) {
            winston.error("Getting the list of the client's personal channels failed with error: ", error);
            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
        return null;
    }).catch(function(error) {
        winston.error("Getting the list of channels failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};



/**
* @api {GET} /apiv2/channels/event/:id Channels - 12 hour epg
* @apiName livetv_12hour_epg
* @apiGroup DeviceAPI
*
* @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
* @apiParam {Number} channelNumber Channel numbers.
* @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
    *       "status_code": 200,
    *       "error_code": 1,
    *       "timestamp": 1517479302000, //unix timestamp in milliseconds
    *       "error_description": 'OK',
    *       "extra_data": 'OK_DATA',
    *       "response_object": [
        *       {
    *          "channelName": "channel name",
    *          "id": 1, //-1 for default epgs
    *          "number": 100, //channel number
    *          "title": "event title",
    *          "scheduled": true, //values true/false
    *          "description": "short event description",
    *          "shortname": "event short name",
    *          "programstart": "mm/dd/yyyy HH:MM:ss",
    *          "programend": "mm/dd/yyyy HH:MM:ss",
    *          "duration": 1800, //in seconds
    *          "progress": 20 //value in range [0:100] for current event, <0 for future events
        *       }, ....
    *       ]
*   }
*/
exports.event_get = function (req, res) {
  const client_timezone = req.body.device_timezone; //offset of the client will be added to time - related info
  const current_human_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate
  const interval_end_human = dateFormat((Date.now() + 43200000), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate, in the interval of 12 hours
  let channel_title = "";
  const channelNumber = req.params.channelId;

  models.channels.findOne({
    attributes: ['title'],
    where: {channel_number: channelNumber, company_id: req.thisuser.company_id}
  }).then(function (thischannel) {
    if (thischannel) channel_title = thischannel.title;
    models.my_channels.findOne({
      attributes: ['title'],
      where: {channel_number: channelNumber, company_id: req.thisuser.company_id}
    }).then(function (user_channel) {
      if (user_channel) channel_title = user_channel.title;
      models.epg_data.findAll({
        attributes: ['id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description'],
        order: [['program_start', 'ASC']],
        limit: 6,
        include: [
          {
            model: models.channels, required: true, attributes: ['title', 'channel_number'],
            where: {channel_number: channelNumber} //limit data only for this channel
          },
          {
            model: models.program_schedule,
            required: false, //left join
            attributes: ['id'],
            where: {login_id: req.thisuser.id}
          }
        ],
        where: Sequelize.and(
          {program_start: {lte: interval_end_human}, company_id: req.thisuser.company_id},
          Sequelize.or(
            Sequelize.and(
              {program_start: {lte: current_human_time}},
              {program_end: {gte: current_human_time}}
            ),
            Sequelize.and(
              {program_start: {gte: current_human_time}},
              {program_end: {lte: interval_end_human}}
            )
          )
        )
      }).then(function (result) {
        let raw_result = [];
        let default_programs = [];
        result.forEach(function (obj) {
          let raw_obj = {};

          Object.keys(obj.toJSON()).forEach(function (k) {
            if (typeof obj[k] == 'object') {
              Object.keys(obj[k]).forEach(function (j) {
                const programstart = parseInt(obj.program_start.getTime()) + parseInt((client_timezone) * 3600000);
                const programend = parseInt(obj.program_end.getTime()) + parseInt((client_timezone) * 3600000);

                raw_obj.channelName = obj[k].title;
                raw_obj.id = obj.id;
                raw_obj.number = obj[k].channel_number;
                raw_obj.title = obj.title;
                raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id);
                raw_obj.description = obj.long_description;
                raw_obj.shortname = obj.short_description;
                raw_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                raw_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                raw_obj.duration = obj.duration_seconds;
                raw_obj.progress = Math.round((Date.now() - obj.program_start.getTime()) * 100 / (obj.program_end.getTime() - obj.program_start.getTime()));
              });
            }
          });
          raw_result.push(raw_obj);
        });

        if (result.length < 6) {
          for (let i = 0; i < 6 - result.length; i++) {
            let temp_obj = {};
            temp_obj.channelName = channel_title;
            temp_obj.id = -1;
            temp_obj.number = req.body.channelNumber;
            temp_obj.title = "Program of " + channel_title;
            temp_obj.scheduled = false;
            temp_obj.description = "Program of " + channel_title;
            temp_obj.shortname = "Program of " + channel_title;
            temp_obj.programstart = '01/01/1970 00:00:00';
            temp_obj.programend = '01/01/1970 00:00:00';
            temp_obj.duration = 0;
            temp_obj.progress = 0;
            raw_result.push(temp_obj);
          }
        }
        response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
      }).catch(function (error) {
        winston.error("Getting the next 6 events failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
      });
      return null;
    }).catch(function (error) {
      winston.error("Getting the list of the client's personal channels failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
    return null;
  }).catch(function (error) {
    winston.error("Getting the list of channels failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};



//RETURNS 12 hours of future Epg for a given channel - GET METHOD
/**
 * @api {GET} /apiv2/channels/event Channels - 12 hour epg
 * @apiName livetv_12hour_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {Number} channelNumber Channel numbers.
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name",
 *          "id": 1, //-1 for default epgs
 *          "number": 100, //channel number
 *          "title": "event title",
 *          "scheduled": true, //values true/false
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *       }, ....
 *       ]
 *   }
 */
exports.get_event =  function(req, res) {
    var client_timezone = req.query.device_timezone; //offset of the client will be added to time - related info
    var current_human_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate
    var interval_end_human = dateFormat((Date.now() + 43200000), "yyyy-mm-dd HH:MM:ss"); //get current time to compare with enddate, in the interval of 12 hours
    var channel_title = '';

    models.channels.findOne({
        attributes: ['title'],
        where: {channel_number: req.query.channelNumber, company_id: req.thisuser.company_id}
    }).then(function (thischannel) {
        if(thischannel) channel_title = thischannel.title;
        models.my_channels.findOne({
            attributes: ['title'],
            where: {channel_number: req.query.channelNumber, company_id: req.thisuser.company_id}
        }).then(function (user_channel) {
            if(user_channel) channel_title = user_channel.title;
            models.epg_data.findAll({
                attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
                order: [['program_start', 'ASC']],
                limit: 6,
                include: [
                    {
                        model: models.channels, required: true, attributes: ['title', 'channel_number'],
                        where: {channel_number: req.query.channelNumber} //limit data only for this channel
                    },
                    {model: models.program_schedule,
                        required: false, //left join
                        attributes: ['id'],
                        where: {login_id: req.thisuser.id}
                    }
                ],
                where: Sequelize.and(
                    {program_start: {lte: interval_end_human}, company_id: req.thisuser.company_id},
                    Sequelize.or(
                        Sequelize.and(
                            {program_start:{lte:current_human_time}},
                            {program_end:{gte:current_human_time}}
                        ),
                        Sequelize.and(
                            {program_start: {gte:current_human_time}},
                            {program_end:{lte:interval_end_human}}
                        )
                    )
                )
            }).then(function (result) {
                var raw_result = [];
                var default_programs = [];
                //flatten nested json array
                result.forEach(function(obj){
                    var raw_obj = {};

                    Object.keys(obj.toJSON()).forEach(function(k) {
                        if (typeof obj[k] == 'object') {
                            Object.keys(obj[k]).forEach(function(j) {
                                var programstart = parseInt(obj.program_start.getTime()) +  parseInt((client_timezone) * 3600000);
                                var programend = parseInt(obj.program_end.getTime()) +  parseInt((client_timezone) * 3600000);

                                raw_obj.channelName = obj[k].title;
                                raw_obj.id = obj.id;
                                raw_obj.number = obj[k].channel_number;
                                raw_obj.title = obj.title;
                                raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id);
                                raw_obj.description = obj.long_description;
                                raw_obj.shortname = obj.short_description;
                                raw_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                                raw_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                                raw_obj.duration = obj.duration_seconds;
                                raw_obj.progress = Math.round((Date.now() - obj.program_start.getTime() ) * 100 / (obj.program_end.getTime() - obj.program_start.getTime()));
                            });
                        }
                    });
                    raw_result.push(raw_obj);
                });

                if(result.length <6){
                    for(var i=0; i<6-result.length; i++){
                        var temp_obj = {};
                        temp_obj.channelName = channel_title;
                        temp_obj.id = -1;
                        temp_obj.number = req.query.channelNumber;
                        temp_obj.title = "Program of "+channel_title;
                        temp_obj.scheduled = false;
                        temp_obj.description = "Program of "+channel_title;
                        temp_obj.shortname = "Program of "+channel_title;
                        temp_obj.programstart = '01/01/1970 00:00:00';
                        temp_obj.programend = '01/01/1970 00:00:00';
                        temp_obj.duration = 0;
                        temp_obj.progress = 0;
                        raw_result.push(temp_obj);
                    }
                }
                response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
            }).catch(function(error) {
                winston.error("Getting the next 6 events failed with error: ", error);
                response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
            return null;
        }).catch(function(error) {
            winston.error("Finding the title of the client's channel failed with error: ", error);
            response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
        return null;
    }).catch(function(error) {
        winston.error("Finding the channel's title failed with error: ", error);
        response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};




//RETURNS EPG FOR PROGRAMS CURRENTLY BEING TRANSMITTED IN THE USER'S SUBSCRIBED CHANNELS FOR THIS DEVICE
/**
 * @api {post} /apiv2/channels/current_epgs Channels - current epg
 * @apiName livetv_current_epg
 * @apiGroup DeviceAPI
 *
 * @apiUse body_auth
 * @apiParam {String} auth Encrypted authentication token string.
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name"
 *          "title": "event title",
 *          "number": 100, //channel number
 *          "id": 1, //-1 for default epgs
 *          "scheduled": true, //values true/false
 *          "shortname": "event short name",*
 *          "description": "short event description",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *          "status": 2 // static value, means that the event is currently being transmitted
 *       }, ....
 *       ]
 *   }
 *
 * @apiDescription Returns catchup stream url for the requested channel.
 *
 * Copy paste this auth for testing purposes
 *auth=gPIfKkbN63B8ZkBWj+AjRNTfyLAsjpRdRU7JbdUUeBlk5Dw8DIJOoD+DGTDXBXaFji60z3ao66Qi6iDpGxAz0uyvIj/Lwjxw2Aq7J0w4C9hgXM9pSHD4UF7cQoKgJI/D
 *
 */
exports.current_epgs =  function(req, res) {
    var server_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss"); //start of the day for the user, in server time
    var raw_result = [];

    var qwhere = {};
    if(req.thisuser.show_adult == 0) qwhere.pin_protected = 0; //show adults filter
    else qwhere.pin_protected != ''; //avoid adult filter
    qwhere.company_id = req.thisuser.company_id;

    // requisites for streams provided by the user
    var userstream_qwhere = {"isavailable": true, "login_id": req.thisuser.id};

    // requisites for streams served by the company
    var stream_qwhere = {};
    if(req.thisuser.player.toUpperCase() === 'default'.toUpperCase()) stream_qwhere.stream_format = {$not: 0}; //don't send mpd streams for default player
    if(req.auth_obj.appid === 3) stream_qwhere.stream_format = 2; // send only hls streams for ios application
    stream_qwhere.stream_source_id = req.thisuser.channel_stream_source_id; // streams come from the user's stream source
    stream_qwhere.stream_mode = 'live';
    stream_qwhere.stream_resolution = {$like: "%"+req.auth_obj.appid+"%"};

    models.my_channels.findAll({
        attributes: ['channel_number', 'title'], order: [[ 'channel_number', 'ASC' ]], where: userstream_qwhere,
        include: [{ model: models.genre, required: true, attributes: ['icon_url'], where: {is_available: true, company_id: req.thisuser.company_id} }]
    }).then(function (user_channel) {
        models.channels.findAll({
            attributes: ['title', 'channel_number'], order: [[ 'channel_number', 'ASC' ]], where: qwhere,
            include: [
                {model: models.packages_channels,
                    required: true,
                    attributes:[],
                    include:[
                        {model: models.package,
                            required: true,
                            attributes: [],
                            where: {package_type_id: req.auth_obj.screensize},
                            include:[
                                {model: models.subscription,
                                    required: true,
                                    attributes: [],
                                    where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
                                }
                            ]}
                    ]},
                { model: models.channel_stream, required: true, attributes:[] },
                {
                    model: models.epg_data, required: false,
                    attributes: [
                        'id', 'title', 'short_description', 'long_description', 'short_name', 'duration_seconds',
                        db_funct.final_time('program_start', 'program_start', 'HOUR', req.body.device_timezone, '%m/%d/%Y %H:%i:%s'),
                        db_funct.final_time('program_end', 'program_end', 'HOUR', req.body.device_timezone, '%m/%d/%Y %H:%i:%s'),
                        db_funct.add_constant(false, 'scheduled')
                    ],
                    where: {program_start: {lte: server_time}, program_end: {gte: server_time}, company_id: req.thisuser.company_id}
                }
            ]
        }).then(function (channels) {
            for(var i=0; i< channels.length; i++){
                var raw_obj = {};
                raw_obj.channelName =  channels[i].title;
                raw_obj.title =  (channels[i].epg_data[0]) ? channels[i].epg_data[0].title : "Program of "+ channels[i].title;
                raw_obj.number =  channels[i].channel_number;
                raw_obj.id = (channels[i].epg_data[0]) ? channels[i].epg_data[0].id : -1;
                raw_obj.scheduled = false;
                raw_obj.shortname = (channels[i].epg_data[0]) ? channels[i].epg_data[0].short_description : "Program of "+ channels[i].title;
                raw_obj.description = (channels[i].epg_data[0]) ?  channels[i].epg_data[0].long_description : "Program of "+ channels[i].title;
                raw_obj.programstart = (channels[i].epg_data[0]) ? channels[i].epg_data[0].program_start : "01/01/1970 00:00:00";
                raw_obj.programend = (channels[i].epg_data[0]) ? channels[i].epg_data[0].program_end : "01/01/1970 00:00:00";
                raw_obj.duration = (channels[i].epg_data[0]) ? channels[i].epg_data[0].duration_seconds : 0;
                raw_obj.progress = (channels[i].epg_data[0]) ? Math.round(((Date.now() + 3600000*req.body.device_timezone) - moment(channels[i].epg_data[0].program_start, 'MM/DD/YYYY HH:mm:ss').format('x')) / (channels[i].epg_data[0].duration_seconds * 10)) : 0;
                raw_obj.status = 2;

                raw_result.push(raw_obj);
            }
            if(user_channel){
                for(var i=0; i<user_channel.length; i++){
                    var raw_obj = {};
                    raw_obj.channelName =  user_channel[i].title;
                    raw_obj.title =  user_channel[i].title;
                    raw_obj.number =  user_channel[i].channel_number;
                    raw_obj.id = -1;
                    raw_obj.scheduled = false;
                    raw_obj.shortname = "Program of "+ user_channel[i].title;
                    raw_obj.description = "Program of "+ user_channel[i].title;
                    raw_obj.programstart = "01/01/1970 00:00:00";
                    raw_obj.programend = "01/01/1970 00:00:00";
                    raw_obj.duration = 0;
                    raw_obj.progress = 0;
                    raw_obj.status = 2;
                    raw_result.push(raw_obj);
                }
            }
            response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
        }).catch(function(error) {
            winston.error("Finding the channels available for this user failed with error: ", error);
            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
        return null;
    }).catch(function(error) {
        winston.error("Finding the client's personal channels failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};




//RETURNS EPG FOR PROGRAMS CURRENTLY BEING TRANSMITTED IN THE USER'S SUBSCRIBED CHANNELS FOR THIS DEVICE
/**
 * @api {GET} /apiv2/channels/current_epgs Channels - current epg
 * @apiName livetv_current_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name"
 *          "title": "event title",
 *          "number": 100, //channel number
 *          "id": 1, //-1 for default epgs
 *          "scheduled": true, //values true/false
 *          "shortname": "event short name",*
 *          "description": "short event description",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *          "status": 2 // static value, means that the event is currently being transmitted
 *       }, ....
 *       ]
 *   }
 */
exports.get_current_epgs =  function(req, res) {
    var server_time = dateFormat(Date.now(), "yyyy-mm-dd HH:MM:ss"); //start of the day for the user, in server time
    var raw_result = [];

    var qwhere = {};
    if(req.thisuser.show_adult == 0) qwhere.pin_protected = 0; //show adults filter
    else qwhere.pin_protected != ''; //avoid adult filter
    qwhere.company_id = req.thisuser.company_id;

    // requisites for streams provided by the user
    var userstream_qwhere = {"isavailable": true, "login_id": req.thisuser.id};

    // requisites for streams served by the company
    var stream_qwhere = {};
    if(req.thisuser.player.toUpperCase() === 'default'.toUpperCase()) stream_qwhere.stream_format = {$not: 0}; //don't send mpd streams for default player
    if(req.auth_obj.appid === 3) stream_qwhere.stream_format = 2; // send only hls streams for ios application
    stream_qwhere.stream_source_id = req.thisuser.channel_stream_source_id; // streams come from the user's stream source
    stream_qwhere.stream_mode = 'live';
    stream_qwhere.stream_resolution = {$like: "%"+req.auth_obj.appid+"%"};

    models.my_channels.findAll({
        attributes: ['channel_number', 'title'], order: [[ 'channel_number', 'ASC' ]], where: userstream_qwhere,
        include: [{ model: models.genre, required: true, attributes: ['icon_url'], where: {is_available: true, company_id: req.thisuser.company_id} }]
    }).then(function (user_channel) {
        models.channels.findAll({
            attributes: ['title', 'channel_number'], order: [[ 'channel_number', 'ASC' ]], where: qwhere,
            include: [
                {model: models.packages_channels,
                    required: true,
                    attributes:[],
                    include:[
                        {model: models.package,
                            required: true,
                            attributes: [],
                            where: {package_type_id: req.auth_obj.screensize},
                            include:[
                                {model: models.subscription,
                                    required: true,
                                    attributes: [],
                                    where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}
                                }
                            ]}
                    ]},
                { model: models.channel_stream, required: true, attributes:[] },
                {
                    model: models.epg_data, required: false,
                    attributes: [
                        'id', 'title', 'short_description', 'long_description', 'short_name', 'duration_seconds',
                        db_funct.final_time('program_start', 'program_start', 'HOUR', req.query.device_timezone, '%m/%d/%Y %H:%i:%s'),
                        db_funct.final_time('program_end', 'program_end', 'HOUR', req.query.device_timezone, '%m/%d/%Y %H:%i:%s'),
                        db_funct.add_constant(false, 'scheduled')
                    ],
                    where: {program_start: {lte: server_time}, program_end: {gte: server_time}, company_id: req.thisuser.company_id}
                }
            ]
        }).then(function (channels) {
            for(var i=0; i< channels.length; i++){
                var raw_obj = {};
                raw_obj.channelName =  channels[i].title;
                raw_obj.title =  (channels[i].epg_data[0]) ? channels[i].epg_data[0].title : "Program of "+ channels[i].title;
                raw_obj.number =  channels[i].channel_number;
                raw_obj.id = (channels[i].epg_data[0]) ? channels[i].epg_data[0].id : -1;
                raw_obj.scheduled = false;
                raw_obj.shortname = (channels[i].epg_data[0]) ? channels[i].epg_data[0].short_description : "Program of "+ channels[i].title;
                raw_obj.description = (channels[i].epg_data[0]) ?  channels[i].epg_data[0].long_description : "Program of "+ channels[i].title;
                raw_obj.programstart = (channels[i].epg_data[0]) ? channels[i].epg_data[0].program_start : "01/01/1970 00:00:00";
                raw_obj.programend = (channels[i].epg_data[0]) ? channels[i].epg_data[0].program_end : "01/01/1970 00:00:00";
                raw_obj.duration = (channels[i].epg_data[0]) ? channels[i].epg_data[0].duration_seconds : 0;
                raw_obj.progress = (channels[i].epg_data[0]) ? Math.round(((Date.now() + 3600000*req.query.device_timezone) - moment(channels[i].epg_data[0].program_start, 'MM/DD/YYYY HH:mm:ss').format('x')) / (channels[i].epg_data[0].duration_seconds * 10)) : 0;
                raw_obj.status = 2;

                raw_result.push(raw_obj);
            }
            if(user_channel){
                for(var i=0; i<user_channel.length; i++){
                    var raw_obj = {};
                    raw_obj.channelName =  user_channel[i].title;
                    raw_obj.title =  user_channel[i].title;
                    raw_obj.number =  user_channel[i].channel_number;
                    raw_obj.id = -1;
                    raw_obj.scheduled = false;
                    raw_obj.shortname = "Program of "+ user_channel[i].title;
                    raw_obj.description = "Program of "+ user_channel[i].title;
                    raw_obj.programstart = "01/01/1970 00:00:00";
                    raw_obj.programend = "01/01/1970 00:00:00";
                    raw_obj.duration = 0;
                    raw_obj.progress = 0;
                    raw_obj.status = 2;
                    raw_result.push(raw_obj);
                }
            }
            response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
        }).catch(function(error) {
            winston.error("Finding the channels available to the user failed with error: ", error);
            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
        return null;
    }).catch(function(error) {
        winston.error("Finding the user's personal channels failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};


//RETURNS 4 hours of Epg for the channels listed in the number parameter
/**
 * @api {POST} /apiv2/channels/epg Channels - 4 hour epg
 * @apiName livetv_4hour_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {String} number Comma-separated list of channel numbers.
 * @apiParam {Number} timeshift Represents number of epg page in the application
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name",
 *          "number": 100, //channel number
 *          "id": 1, //-1 for default epgs
 *          "scheduled": true, //values true/false
 *          "title": "event title",
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800 //in seconds
 *       }, ....
 *       ]
 *   }
 */
exports.epg = function(req, res) {
    var client_timezone = req.body.device_timezone;
    //request parameters: list of channel numbers for the epg, timeshift
    var channel_number = req.body.number.toString().split(',');
    var timeshift = req.body.timeshift;

    var starttime = dateFormat((Date.now() + (parseInt(timeshift) + 2) * 3600000), "yyyy-mm-dd HH:MM:ss");
    var endtime   = dateFormat((Date.now() + (parseInt(timeshift) - 2) * 3600000), "yyyy-mm-dd HH:MM:ss");

    //gets epg of the channels from the list for the next 4 hours starting from timeshift
    models.epg_data.findAll({
        attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'channel_number', 'long_description' ],
        include: [
            {
                model: models.channels, required: true, attributes: ['title', 'channel_number'],
                where: {channel_number: {in: channel_number}} //limit data only for this list of channels
            },
            {model: models.program_schedule,
                required: false, //left join
                attributes: ['id'],	where: {login_id: req.thisuser.id}
            }
        ],
        order: [['channel_number', 'ASC'], ['program_start', 'ASC']],
        where: Sequelize.and(
            {company_id: req.thisuser.company_id},
            Sequelize.or(
                {program_start:{between:[starttime, endtime]}},
                {program_end: {between:[starttime, endtime]}},
                Sequelize.and(
                    {program_start: {lte:starttime}},
                    {program_end:{gte:endtime}}
                )
            )
        )
    }).then(function (result) {
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        if(j === 'dataValues'){
                            var programstart = parseInt(obj.program_start.getTime()) +  parseInt(client_timezone * 3600000);
                            var programend = parseInt(obj.program_end.getTime()) +  parseInt(client_timezone * 3600000);

                            raw_obj.channelName = obj[k].title;
                            raw_obj.number = obj[k].channel_number;
                            raw_obj.id = obj.id;
                            raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id);
                            raw_obj.title = obj.title;
                            raw_obj.description = obj.long_description;
                            raw_obj.shortname = obj.short_description;
                            raw_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                            raw_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                            raw_obj.duration = obj.duration_seconds;
                        }
                    });
                }
            });
            raw_result.push(raw_obj);
        });
        response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
    }).catch(function(error) {
        winston.error("Finding the events in the 4 hour timeframe failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};


//RETURNS 4 hours of Epg for the channels listed in the number parameter - GET METHOD
/**
 * @api {GET} /apiv2/channels/epg Channels - 4 hour epg
 * @apiName livetv_4hour_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {String} number Comma-separated list of channel numbers.
 * @apiParam {Number} timeshift Represents number of epg page in the application
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name",
 *          "number": 100, //channel number
 *          "id": 1, //-1 for default epgs
 *          "scheduled": true, //values true/false
 *          "title": "event title",
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800 //in seconds
 *       }, ....
 *       ]
 *   }
 */
exports.get_epg = function(req, res) {
    var client_timezone = req.query.device_timezone;
    //request parameters: list of channel numbers for the epg, timeshift
    var channel_number = req.query.number.toString().split(',');
    var timeshift = req.query.timeshift;

    var starttime = dateFormat((Date.now() + (parseInt(timeshift) + 2) * 3600000), "yyyy-mm-dd HH:MM:ss");
    var endtime   = dateFormat((Date.now() + (parseInt(timeshift) - 2) * 3600000), "yyyy-mm-dd HH:MM:ss");

    //gets epg of the channels from the list for the next 4 hours starting from timeshift
    models.epg_data.findAll({
        attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'channel_number', 'long_description' ],
        include: [
            {
                model: models.channels, required: true, attributes: ['title', 'channel_number'],
                where: {channel_number: {in: channel_number}} //limit data only for this list of channels
            },
            {model: models.program_schedule,
                required: false, //left join
                attributes: ['id'],	where: {login_id: req.thisuser.id}
            }
        ],
        order: [['channel_number', 'ASC'], ['program_start', 'ASC']],
        where: Sequelize.and(
            {company_id: req.thisuser.company_id},
            Sequelize.or(
                {program_start:{between:[starttime, endtime]}},
                {program_end: {between:[starttime, endtime]}},
                Sequelize.and(
                    {program_start: {lte:starttime}},
                    {program_end:{gte:endtime}}
                )
            )
        )
    }).then(function (result) {
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        if(j === 'dataValues'){
                            var programstart = parseInt(obj.program_start.getTime()) +  parseInt(client_timezone * 3600000);
                            var programend = parseInt(obj.program_end.getTime()) +  parseInt(client_timezone * 3600000);

                            raw_obj.channelName = obj[k].title;
                            raw_obj.number = obj[k].channel_number;
                            raw_obj.id = obj.id;
                            raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id);
                            raw_obj.title = obj.title;
                            raw_obj.description = obj.long_description;
                            raw_obj.shortname = obj.short_description;
                            raw_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                            raw_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                            raw_obj.duration = obj.duration_seconds;
                        }
                    });
                }
            });
            raw_result.push(raw_obj);
        });
        response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
    }).catch(function(error) {
        winston.error("Getting the events of the 4 hour timeframe failed with error: ", error);
        response.send_res_get(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};


//RETURNS ENTIRE EPG FOR A SPECIFIC CHANNEL IN A SPECIFIC DAY
/**
 * @api {POST} /apiv2/channels/daily_epg Channels - daily epg
 * @apiName livetv_daily_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {Number} channel_number Channel number
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 * @apiParam {Number} day 0 for today, -x/x for other days.
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name"
 *          "id": 1, //-1 for default epgs
 *          "number": 100, //channel number
 *          "title": "event title",
 *          "scheduled": true, //values true/false
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *          "status": 2 // 1 for past, 2 for current, 3 for future events
 *       }, ....
 *       ]
 *   }
 */
exports.daily_epg =  function(req, res) {
    var client_timezone = req.body.device_timezone; //offset of the client will be added to time - related info
    var interval_start = dateFormat(Date.now() - client_timezone*3600 + req.body.day*3600000*24, "yyyy-mm-dd 00:00:00"); //start of the day for the user, in server time
    var interval_end = dateFormat((Date.now() - client_timezone*3600 + req.body.day*3600000*24), "yyyy-mm-dd 23:59:59"); //end of the day for the user, in server time

    async.auto({
        get_channel: function(callback) {
            models.channels.findOne({
                attributes: ['title'],
                where: {channel_number: req.body.channel_number, company_id: req.thisuser.company_id}
            }).then(function (channel) {
                if(!channel){
                    models.my_channels.findOne({
                        attributes: ['title'],
                        where: {channel_number: req.body.channel_number, company_id: req.thisuser.company_id}
                    }).then(function (user_channel) {
                        if(!user_channel){
                            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                        }
                        else callback(null, user_channel);
                    }).catch(function(error) {
                        winston.error("Finding the title of the client's personal channel failed with error: ", error);
                        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                    });
                }
                else callback(null, channel.title);
                return null;
            }).catch(function(error) {
                winston.error("Finding the channel's title failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
        },
        get_epg: ['get_channel', function(results, callback) {
            models.epg_data.findAll({
                attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
                order: [['program_start', 'ASC']],
                include: [
                    {
                        model: models.channels, required: true, attributes: [],  where: {channel_number: req.body.channel_number},
                        include: {model: models.packages_channels, required: true, attributes:[],
                            include:[{model: models.package, required: true, attributes: [],
                                where: {package_type_id: req.auth_obj.screensize},
                                include:[{model: models.subscription, required: true, attributes: [], where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}}
                                ]}
                            ]}
                    },
                    {model: models.program_schedule,
                        required: false, //left join
                        attributes: ['id'],
                        where: {login_id: req.thisuser.id}
                    }
                ],
                where: {program_start: {gte: interval_start}, program_end:{lte: interval_end}, company_id: req.thisuser.company_id}
            }).then(function (result) {
                if(!result){
                    callback(null, results.get_channel, []); //no epg for this channel, passing empty array instead
                }
                else callback(null, results.get_channel, result);
            }).catch(function(error) {
                winston.error("Finding the events for the current day failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
        }],
        send_epg: ['get_epg', function(epg_data, callback) {
            var raw_result = [];
            if(epg_data.get_epg[1].length<3){
                for(var i=0; i<3-epg_data.get_epg[1].length; i++){
                    var temp_obj = {};
                    temp_obj.channelName = epg_data.get_epg[0];
                    temp_obj.id = -1;
                    temp_obj.number = req.body.channel_number;
                    temp_obj.title = "Program of "+epg_data.get_epg[0];
                    temp_obj.scheduled = false;
                    temp_obj.description = "Program of "+epg_data.get_epg[0];
                    temp_obj.shortname = "Program of "+epg_data.get_epg[0];
                    temp_obj.programstart = '01/01/1970 00:00:00';
                    temp_obj.programend = '01/01/1970 00:00:00';
                    temp_obj.duration = 0; //duration 0 for non-real epg
                    temp_obj.progress = 0; //progress 0 for non-real epg
                    temp_obj.status = 0; //status 0 means this is non-real epg
                    raw_result.push(temp_obj);
                }
            }
            for(var i=0; i<epg_data.get_epg[1].length; i++){
                var temp_obj = {};
                var programstart = parseInt(epg_data.get_epg[1][i].program_start.getTime()) +  parseInt((client_timezone) * 3600000);
                var programend = parseInt(epg_data.get_epg[1][i].program_end.getTime()) +  parseInt((client_timezone) * 3600000);

                temp_obj.channelName = epg_data.get_epg[0];
                temp_obj.id = epg_data.get_epg[1][i].id;
                temp_obj.number = req.body.channel_number;
                temp_obj.title = epg_data.get_epg[1][i].title;
                temp_obj.scheduled = (!epg_data.get_epg[1][i].program_schedules[0]) ? false : schedule.is_scheduled(epg_data.get_epg[1][i].program_schedules[0].id);
                temp_obj.status = program_status(epg_data.get_epg[1][i].program_start.getTime(), epg_data.get_epg[1][i].program_end.getTime());
                temp_obj.description = epg_data.get_epg[1][i].long_description;
                temp_obj.shortname = epg_data.get_epg[1][i].short_description;
                temp_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                temp_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                temp_obj.duration = epg_data.get_epg[1][i].duration_seconds;
                temp_obj.progress = Math.round((Date.now() - epg_data.get_epg[1][i].program_start.getTime() ) / (epg_data.get_epg[1][i].duration_seconds * 10));
                raw_result.push(temp_obj);
            }
            response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        }]
    }, function(error, results) {
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};



//RETURNS ENTIRE EPG FOR A SPECIFIC CHANNEL IN A SPECIFIC DAY
/**
 * @api {GET} /apiv2/channels/daily_epg Channels - daily epg
 * @apiName livetv_daily_epg
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} auth Encrypted string composed of username, password, appid, boxid and timestamp.
 * @apiParam {Number} channel_number Channel number
 * @apiParam {Number} device_timezone Timezone offset of the device. Values in range of [-12:12]
 * @apiParam {Number} day 0 for today, -x/x for other days.
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1517479302000, //unix timestamp in milliseconds
 *       "error_description": 'OK',
 *       "extra_data": 'OK_DATA',
 *       "response_object": [
 *       {
 *          "channelName": "channel name"
 *          "id": 1, //-1 for default epgs
 *          "number": 100, //channel number
 *          "title": "event title",
 *          "scheduled": true, //values true/false
 *          "description": "short event description",
 *          "shortname": "event short name",
 *          "programstart": "mm/dd/yyyy HH:MM:ss",
 *          "programend": "mm/dd/yyyy HH:MM:ss",
 *          "duration": 1800, //in seconds
 *          "progress": 20 //value in range [0:100] for current event, <0 for future events
 *          "status": 2 // 1 for past, 2 for current, 3 for future events
 *       }, ....
 *       ]
 *   }
 */
exports.get_daily_epg =  function(req, res) {

    var client_timezone = req.query.device_timezone;
    var interval_start = dateFormat(Date.now() - client_timezone*3600 + req.query.day*3600000*24, "yyyy-mm-dd 00:00:00"); //start of the day for the user, in server time
    var interval_end = dateFormat((Date.now() - client_timezone*3600 + req.query.day*3600000*24), "yyyy-mm-dd 23:59:59"); //end of the day for the user, in server time
    var channel_number = req.query.channel_number;

    async.auto({
        get_channel: function(callback) {
            models.channels.findOne({
                attributes: ['title'],
                where: {channel_number: channel_number, company_id: req.thisuser.company_id}
            }).then(function (channel) {
                if(!channel){
                    models.my_channels.findOne({
                        attributes: ['title'],
                        where: {channel_number: channel_number, company_id: req.thisuser.company_id}
                    }).then(function (user_channel) {
                        if(!user_channel){
                            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                        }
                        else callback(null, user_channel);
                    }).catch(function(error) {
                        winston.error("Getting the title of the client's personal channel failed with error: ", error);
                        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                    });
                }
                else callback(null, channel.title);
                return null;
            }).catch(function(error) {
                winston.error("Getting the channel's title failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
        },
        get_epg: ['get_channel', function(results, callback) {
            models.epg_data.findAll({
                attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
                order: [['program_start', 'ASC']],
                include: [
                    {
                        model: models.channels, required: true, attributes: [],  where: {channel_number: channel_number},
                        include: {model: models.packages_channels, required: true, attributes:[],
                            include:[{model: models.package, required: true, attributes: [],
                                where: {package_type_id: req.auth_obj.screensize},
                                include:[{model: models.subscription, required: true, attributes: [], where: {login_id: req.thisuser.id, end_date: {$gte: Date.now()}}}
                                ]}
                            ]}
                    },
                    {model: models.program_schedule,
                        required: false, //left join
                        attributes: ['id'],
                        where: {login_id: req.thisuser.id}
                    }
                ],
                where: {program_start: {gte: interval_start}, program_end:{lte: interval_end}, company_id: req.thisuser.company_id}
            }).then(function (result) {
                if(!result){
                    callback(null, results.get_channel, []); //no epg for this channel, passing empty array instead
                }
                else callback(null, results.get_channel, result);
            }).catch(function(error) {
                winston.error("Getting the events for a specific day failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
        }],
        send_epg: ['get_epg', function(epg_data, callback) {
            var raw_result = [];
            if(epg_data.get_epg[1].length<3){
                for(var i=0; i<3-epg_data.get_epg[1].length; i++){
                    var temp_obj = {};
                    temp_obj.channelName = epg_data.get_epg[0];
                    temp_obj.id = -1;
                    temp_obj.number = channel_number;
                    temp_obj.title = "Program of "+epg_data.get_epg[0];
                    temp_obj.scheduled = false;
                    temp_obj.description = "Program of "+epg_data.get_epg[0];
                    temp_obj.shortname = "Program of "+epg_data.get_epg[0];
                    temp_obj.programstart = '01/01/1970 00:00:00';
                    temp_obj.programend = '01/01/1970 00:00:00';
                    temp_obj.duration = 0; //duration 0 for non-real epg
                    temp_obj.progress = 0; //progress 0 for non-real epg
                    temp_obj.status = 0; //status 0 means this is non-real epg
                    raw_result.push(temp_obj);
                }
            }
            for(var i=0; i<epg_data.get_epg[1].length; i++){
                var temp_obj = {};
                var programstart = parseInt(epg_data.get_epg[1][i].program_start.getTime()) +  parseInt((client_timezone) * 3600000);
                var programend = parseInt(epg_data.get_epg[1][i].program_end.getTime()) +  parseInt((client_timezone) * 3600000);

                temp_obj.channelName = epg_data.get_epg[0];
                temp_obj.id = epg_data.get_epg[1][i].id;
                temp_obj.number = channel_number;
                temp_obj.title = epg_data.get_epg[1][i].title;
                temp_obj.scheduled = (!epg_data.get_epg[1][i].program_schedules[0]) ? false : schedule.is_scheduled(epg_data.get_epg[1][i].program_schedules[0].id);
                temp_obj.status = program_status(epg_data.get_epg[1][i].program_start.getTime(), epg_data.get_epg[1][i].program_end.getTime());
                temp_obj.description = epg_data.get_epg[1][i].long_description;
                temp_obj.shortname = epg_data.get_epg[1][i].short_description;
                temp_obj.programstart = dateFormat(programstart, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                temp_obj.programend = dateFormat(programend, 'mm/dd/yyyy HH:MM:ss'); //add timezone offset to program_start timestamp, format it as M/D/Y H:m:s
                temp_obj.duration = epg_data.get_epg[1][i].duration_seconds;
                temp_obj.progress = Math.round((Date.now() - epg_data.get_epg[1][i].program_start.getTime() ) / (epg_data.get_epg[1][i].duration_seconds * 10));
                raw_result.push(temp_obj);
            }
            response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
        }]
    }, function(error, results) {
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};


// to be remove, replaced by function get_epg_data
exports.test_get_epg_data = function(req, res) {

    var timeshift = 0;
    var minusminutes = isNaN(parseInt(req.query._start)) ? -180: parseInt(req.query._start);
    var plusminutes =   isNaN(parseInt(req.query._end)) ? 1440: parseInt(req.query._end);
    var starttime = (Date.now() +  minusminutes * 60000);
    var endtime   = (Date.now() +  plusminutes * 60000);

    if(req.query.channelnumbers) {
        var channelnumbers = req.query.channelnumbers.toString().split(',');
    }
    else {
        var channelnumbers = [];
    }

    var final_where = {};

    final_where.attributes = [ 'id', 'channel_number', 'title',[db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('icon_url')), 'icon_url']],
        final_where.include = [{
            model: models.epg_data, attributes: ['title', 'short_name', 'short_description', 'long_description', 'program_start','program_end','duration_seconds', 'long_description'],
            required: false,
            where: Sequelize.and(
                {company_id: req.thisuser.company_id},
                {program_start: {gte:starttime}},
                {program_start: {lte:endtime}}
            )
        }];

    if(channelnumbers.length > 0) final_where.where = {channel_number: {in: channelnumbers}}; //limit data only for this list of channels

    final_where.order = ['channel_number'];
    final_where.where.company_id = req.thisuser.company_id;

    models.channels.findAll(
        final_where
    ).then(function (result) {
        res.send(result);
    }).catch(function(error) {
        winston.error("Finding the events for a specific list of channels failed with error: ", error);
        res.send(error);
    });
};




/**
 * @api {get} /apiv2/channels/epgdata Request Channels EPG Data
 * @apiName epgdata
 * @apiGroup EPG
 *
 * @apiHeader {String} auth End User auth token.
 *
 * @apiParam {Number} [_start]  Optional start time in minutes. If missing equals -180
 * @apiParam {Number} [_end] Optional end time in minutes. If missing equals 1440
 * @apiParam {String[]} [channelnumbers] Optional channel number separated by comma
 *
 *@apiDescription Copy paste this auth for testing purposes
 *auth=/ihCuMthnmY7pV3WLgC68i70zwLp6DUrLyFe9dOUEkxUBFH9WrUcA95GFAecSJH9HG9tvymreMOFlBviVd3IcII4Z/SiurlGoz9AMtE5KGFZvCl1FQ3FKZYP3LeFgzVs\r\nDQjxaup3sKRljj4lmKUDTA==
 *
 */

exports.get_epg_data = function(req, res) {

    var timeshift = 0;
    var minusminutes = isNaN(parseInt(req.query._start)) ? -180: parseInt(req.query._start);
    var plusminutes = isNaN(parseInt(req.query._end)) ? 1440: parseInt(req.query._end);
    var starttime = (Date.now() +  minusminutes * 60000);
    var endtime   = (Date.now() +  plusminutes * 60000);

    if(req.query.channelnumbers) {
        var channelnumbers = req.query.channelnumbers.toString().split(',');
    }
    else {
        var channelnumbers = [];
    }

    var final_where = {};

    final_where.attributes = [ 'id', 'channel_number', 'title',[db.sequelize.fn("concat", req.app.locals.backendsettings[req.thisuser.company_id].assets_url, db.sequelize.col('icon_url')), 'icon_url']],
        final_where.include = [{
            model: models.epg_data, attributes: ['id','title', 'short_name', 'short_description', 'long_description', 'program_start','program_end','duration_seconds', 'long_description'],
            required: false,
            //where: Sequelize.and(
            //    {company_id: req.thisuser.company_id},
            //    {program_start: {gte:starttime}},
            //    {program_start: {lte:endtime}}
            //),
            where: Sequelize.and(
                {company_id: req.thisuser.company_id},
                Sequelize.or(
                    Sequelize.and(
                        {program_start:{gte:starttime}},
                        {program_start:{lte:endtime}}
                    ),
                    Sequelize.and(
                        {program_end: {gte:starttime}},
                        {program_end:{lte:endtime}}
                    )
                )
            ),

            include: [{model:models.program_schedule, attributes:['id'], required:false, where: {login_id:req.thisuser.id}}]
        }];

    if(channelnumbers.length > 0) final_where.where = {channel_number: {in: channelnumbers}}; //limit data only for this list of channels

    final_where.order = ['channel_number'];

    models.channels.findAll(
        final_where
    ).then(function (result) {
        res.send(result);
    }).catch(function(error) {
        winston.error("Getting the events for a specific list of channels failed with error: ", error);
        res.send(error);
    });
};


function program_status(programstart, programend){
    if(programstart < Date.now() && programend < Date.now()){
        return 1;
    }
    else if(programstart < Date.now() && programend > Date.now()){
        return 2;
    }
    else return 3
}
