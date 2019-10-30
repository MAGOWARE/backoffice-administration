'use strict';
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    Sequelize = require('sequelize'),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston')),
    dateFormat = require('dateformat'),
    async = require('async'),
    schedule = require(path.resolve("./modules/deviceapiv2/server/controllers/schedule.server.controller.js")),
    akamai_token_generator = require(path.resolve('./modules/streams/server/controllers/akamai_token_v2')),
    models = db.models;

/**
 * @api {post} /apiv2/channels/catchup_events /apiv2/channels/catchup_events
 * @apiVersion 0.2.0
 * @apiName CatchupEvents
 * @apiGroup DeviceAPI
 * @apiParam {String} auth Encrypted authentication token string.
 * @apiDescription Returns list of epg data for the given channel, in a specific day
 * @apiSuccessExample Success-Response:
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1,
 *       "error_description": "OK",
 *       "extra_data": "OK_DATA",
 *       "response_object": [
 *          {
 *              "channelName": "Channel name",
 *              "id": 206778,
 *              "number": 100,
 *              "title": "Event title",
 *              "scheduled": false, // [true, false]
 *              "description": "Event description",
 *              "shortname": "Event short name",
 *              "programstart": "05/24/2018 23:55:00",
 *              "programend": "05/25/2018 00:40:00",
 *              "duration": 2700, //in seconds
 *              "progress": 10 //for current events in [1-100]
 *          }, ....
 *       ]
 *     }
 * @apiErrorExample Error-Response:
 *     {
 *       "status_code": 704,
 *       "error_code": -1,
 *       "timestamp": 1,
 *       "error_description": "DATABASE_ERROR",
 *       "extra_data": "Error connecting to database",
 *       "response_object": []
 *     }
 *
 *
 */
exports.catchup_events =  function(req, res) {
    req.body.day = parseInt(req.body.day); //convert day to integer
    var client_timezone = parseInt(req.body.device_timezone.replace(' ', '')); //offset of the client will be added to time - related info. converted to int and cleaned of spaces
    var client_time = (client_timezone >= 0 ) ? (24 - client_timezone) : (0 - client_timezone);
    var shift_direction = ( client_timezone >= 0 ) ? 0 : 1; //for negative offset, there should be a shift of 1 day more to the right
    //var current_human_time = dateFormat(Date.now()  + (req.body.day -1 + shift_direction)*3600000*24, "yyyy-mm-dd "+client_time+":00:00"); //start of the day for the user, in server time
    //var interval_end_human = dateFormat(Date.now()  + (req.body.day + shift_direction)*3600000*24, "yyyy-mm-dd "+client_time+":00:00");  //end of the day for the user, in server time

    var d = new Date(); // Today!
        d.setDate(d.getDate() - req.body.day); // search day.

    var day_start = dateFormat(d, "yyyy-mm-dd 00:00:00"); //start of the day for the user, in server time
    var day_end = dateFormat(d, "yyyy-mm-dd 23:59:00");  //end of the day for the user, in server time

    models.epg_data.findAll({
        attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
        order: [['program_start', 'ASC']],
        include: [
            {
                model: models.channels, required: true, attributes: ['title', 'channel_number'],
                where: {channel_number: req.body.channelNumber, company_id: req.thisuser.company_id} //limit data only for this channel
            },
            {model: models.program_schedule,
                required: false, //left join
                attributes: ['id'],
                where: {login_id: req.thisuser.id}
            }
        ],
        //where: {program_start: {lte: interval_end_human},
        //        program_end: {gte: current_human_time},
        //        company_id: req.thisuser.company_id}
        where: Sequelize.and(
                            {company_id: req.thisuser.company_id},
                            Sequelize.or(
                                Sequelize.and(
                                    {program_start:{gte:day_start}},
                                    {program_start:{lte:day_end}}
                                ),
                                Sequelize.and(
                                    {program_end: {gte:day_start}},
                                    {program_end:{lte:day_end}}
                                )
                            )
                        )



    }).then(function (result) {
        //todo: what if channel number is invalid and it finds no title???
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        var programstart = parseInt(obj.program_start.getTime()) +  client_timezone * 3600000;
                        var programend = parseInt(obj.program_end.getTime()) +  client_timezone * 3600000;
                        raw_obj.channelName = obj[k].title;
                        raw_obj.id = obj.id;
                        raw_obj.number = obj[k].channel_number;
                        raw_obj.title = obj.title;
                        raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id); //if there is an event in the local memory, return true
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
        response.send_res(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
    }).catch(function(error) {
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });

};



/**
 * @api {get} /apiv2/channels/catchup_events Get Channels Catchup Stream
 * @apiName CatchupEvents
 * @apiGroup Catchup
 *
 * @apiUse body_auth
 * @apiParam {String} auth Encrypted authentication token string.
 * @apiParam {Number} channelNumber Channel number
 * @apiParam {Number} device_timezone Device timezone.
 * @apiDescription Returns list of epg for current day

 * Copy paste this auth for testing purposes
 * auth=gPIfKkbN63B8ZkBWj+AjRNTfyLAsjpRdRU7JbdUUeBlk5Dw8DIJOoD+DGTDXBXaFji60z3ao66Qi6iDpGxAz0uyvIj/Lwjxw2Aq7J0w4C9hgXM9pSHD4UF7cQoKgJI/D
 */
exports.get_catchup_events =  function(req, res) {
    req.query.day = parseInt(req.query.day); //convert day to integer
    var client_timezone = parseInt(req.query.device_timezone.replace(' ', '')); //offset of the client will be added to time - related info. converted to int and cleaned of spaces
    var client_time = (client_timezone >= 0 ) ? (24 - client_timezone) :( 0 - client_timezone);
    var shift_direction = ( client_timezone >= 0 ) ? 0 : 1; //for negative offset, there should be a shift of 1 day more to the right
    var current_human_time = dateFormat(Date.now()  + (req.query.day -1 + shift_direction)*3600000*24, "yyyy-mm-dd "+client_time+":00:00"); //start of the day for the user, in server time
    var interval_end_human = dateFormat(Date.now()  + (req.query.day + shift_direction)*3600000*24, "yyyy-mm-dd "+client_time+":00:00");  //end of the day for the user, in server time

    var d = new Date(); // Today!
    d.setDate(d.getDate() - req.body.day); // search day.

    var day_start = dateFormat(d, "yyyy-mm-dd 00:00:00"); //start of the day for the user, in server time
    var day_end = dateFormat(d, "yyyy-mm-dd 23:59:00");  //end of the day for the user, in server time


    models.epg_data.findAll({
        attributes: [ 'id', 'title', 'short_description', 'short_name', 'duration_seconds', 'program_start', 'program_end', 'long_description' ],
        order: [['program_start', 'ASC']],
        include: [
            {
                model: models.channels, required: true, attributes: ['title', 'channel_number'],
                where: {channel_number: req.query.channelNumber, company_id: req.thisuser.company_id} //limit data only for this channel
            },
            {model: models.program_schedule,
                required: false, //left join
                attributes: ['id'],
                where: {login_id: req.thisuser.id}
            }
        ],
        where: Sequelize.and(
            {company_id: req.thisuser.company_id},
            Sequelize.or(
                Sequelize.and(
                    {program_start:{gte:day_start}},
                    {program_start:{lte:day_end}}
                ),
                Sequelize.and(
                    {program_end: {gte:day_start}},
                    {program_end:{lte:day_end}}
                )
            )
        )


    }).then(function (result) {
        //todo: what if channel number is invalid and it finds no title???
        var raw_result = [];
        //flatten nested json array
        result.forEach(function(obj){
            var raw_obj = {};
            Object.keys(obj.toJSON()).forEach(function(k) {
                if (typeof obj[k] == 'object') {
                    Object.keys(obj[k]).forEach(function(j) {
                        var programstart = parseInt(obj.program_start.getTime()) +  client_timezone * 3600000;
                        var programend = parseInt(obj.program_end.getTime()) +  client_timezone * 3600000;
                        raw_obj.channelName = obj[k].title;
                        raw_obj.id = obj.id;
                        raw_obj.number = obj[k].channel_number;
                        raw_obj.title = obj.title;
                        raw_obj.scheduled = (!obj.program_schedules[0]) ? false : schedule.is_scheduled(obj.program_schedules[0].id); //if there is an event in the local memory, return true
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
        response.send_res_get(req, res, raw_result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=43200');
    }).catch(function(error) {
        winston.error("Searching for the catchup events failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
};


/**
 * @api {post} /apiv2/channels/catchup_stream Get Channels Catchup Stream
 * @apiName CatchupEvents
 * @apiGroup Catchup
 *
 * @apiUse body_auth
 * @apiParam {String} auth Encrypted authentication token string.
 * @apiParam {Number} channelNumber Channel number
 * @apiParam {Number} timestart Unix timestamp where te stream should start.
 * @apiDescription Returns catchup stream url for the requested channel.

 * Copy paste this auth for testing purposes
 *auth=gPIfKkbN63B8ZkBWj+AjRNTfyLAsjpRdRU7JbdUUeBlk5Dw8DIJOoD+DGTDXBXaFji60z3ao66Qi6iDpGxAz0uyvIj/Lwjxw2Aq7J0w4C9hgXM9pSHD4UF7cQoKgJI/D
 */

exports.catchup_stream =  function(req, res) {
    var channel_number = req.body.channelNumber;
    var stream_where = {
        stream_source_id: req.thisuser.channel_stream_source_id, //get streams from source based on client preferences
        stream_mode: 'catchup', //get only catchup streams
        stream_resolution: {$like: "%"+req.auth_obj.appid+"%"} //get streams based on application type
    };

    models.channels.findOne({
        attributes: ['id'],
        include: [{model: models.channel_stream, required: true,  where: stream_where}],
        where: {channel_number: channel_number, company_id: req.thisuser.company_id}
    }).then(function (catchup_streams) {
        if(catchup_streams){
            var thestream = catchup_streams.channel_streams[0].stream_url;

            //check recording engine
            if(catchup_streams.channel_streams[0].recording_engine == 'wowza') {

                //milliseconds required for Date functions
                if(req.body.timestart.toString().length === 10) {
                    req.body.timestart = req.body.timestart * 1000;
                }

                var date = new Date(req.body.timestart);

                var wtime = {};
                wtime.years = date.getFullYear();
                wtime.months = date.getUTCMonth() + 1;
                wtime.days = date.getUTCDate();
                wtime.hours = date.getUTCHours();
                wtime.minutes = date.getUTCMinutes();
                wtime.seconds = date.getUTCSeconds();

                var catchup_moment = date.getFullYear() + (("0" + wtime.months).slice(-2)) + (("0" + wtime.days).slice(-2)) + (("0" + wtime.hours).slice(-2)) + (("0" + wtime.minutes).slice(-2)) + "00";
                thestream = thestream.replace('[epochtime]', catchup_moment);

            }
            else {  //assume it is flussonic

                //if timestamp is bigger than 2.5 ours
                if((Date.now()/1000 - req.body.timestart) > 9000) {
                    thestream = thestream.replace('timeshift_abs','index');
                    thestream = thestream.replace('[epochtime]',req.body.timestart + '-9000');
                }
                else {
                    thestream = thestream.replace('[epochtime]', req.body.timestart);
                }
            }

            var response_data = [{
                "streamurl": thestream, //catchup_streams.channel_streams[0].stream_url.replace('[epochtime]', req.body.timestart)
                "stream_format":  catchup_streams.channel_streams[0].stream_format,
                "drm_platform": catchup_streams.channel_streams[0].drm_platform,
                "token":  catchup_streams.channel_streams[0].token,
                "token_url":  catchup_streams.channel_streams[0].token_url,
                "encryption":  catchup_streams.channel_streams[0].encryption,
                "encryption_url":  catchup_streams.channel_streams[0].encryption_url
            }];

            response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
        }
        else {
            response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store'); //todo: bej nje pershkrim ex no stream found
        }



    }).catch(function(error) {
        winston.error("Searching for the catchup channel data failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
};
