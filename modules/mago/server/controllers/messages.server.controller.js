'use strict';

var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    push_msg = require(path.resolve('./custom_functions/push_messages')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.messages,
    DBDevices = db.devices;
var winston = require("winston");


function save_messages(obj, messagein, ttl, action, callback){

    DBModel.create({
        username: obj.username,
        googleappid: obj.googleappid,
        title: messagein,
        message: messagein,
        action: action,
        company_id: req.token.company_id //save record for this company
    }).then(function(result) {
        if (!result) {
            winston.error("Failed to create messages");
        } else {
            winston.info('Messages saved')
        }
    }).catch(function(err) {
        winston.error("Saving messages failed with error: ", err);
    });

}

/**
 * Create
 */

/**
 * @api {post} /api/messages Push messages - Send notifications
 * @apiVersion 0.2.0
 * @apiName Send push notifications
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 *
 * @apiParam {String} type  Optional field type. Value set ['one', 'all']. Selecting 'all' ignores field username.
 * @apiParam {Number} username  Optional field username.  If type is equal to 'one', a username has to be selected.
 * @apiParam {Boolean} toandroidsmartphone  Mandatory field toandroidsmartphone.  Set to true to send messages to android smart phones.
 * @apiParam {Boolean} toios  Mandatory field toios.  Set to true to send messages to ios smart phones.
 * @apiParam {Boolean} toandroidbox  Mandatory field toandroidbox.  Set to true to send messages to android STB devices.
 * @apiParam {String} title  Mandatory field title. This is the title of the notification that will be displayed.
 * @apiParam {String} message  Mandatory field message. This is the body of the notification that will be displayed.
 * @apiParam {Boolean} sendtoactivedevices  Mandatory field sendtoactivedevices. Set to true if only active (logged) devices should receive the message.
 * @apiParam {Number} timetolive  Mandatory field timetolive, in seconds. Currently not used by the application.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Message sent"
 *      }
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 OK
 *     {
 *       "message": "Error message" //for the actual message refer to list below
 *     }
 *
 *      "You did not select any devices" //Either no users where selected, or no device types were selected
 *      "No devices found with these filters" //There are no devices recorded that fulfill your conditions
 */

exports.create = function(req, res) {
    var no_users = (req.body.type === "one" && req.body.username === null) ? true : false; //no users selected for single user messages, don't send push

    if(no_users){
        return res.status(400).send({
            message: 'You did not select any devices'
        });
    }
    else{
        var where = {}; //the device filters will be passed here
        if(req.body.type === "one") where.login_data_id = req.body.username; //if only one user is selected, filter devices of that user

        if (req.body.appid && req.body.appid.length > 0) {
            var device_types = [];
            for(var j=0; j<req.body.appid.length; j++) device_types.push(parseInt(req.body.appid[j]));
        }
        else return res.status(400).send({ message: "You did not select any device types" });

        if(req.body.sendtoactivedevices) where.device_active = true; //if we only want to send push msgs to active devices, add condition
        where.appid = {in: device_types}; //filter devices by application id
        where.company_id = req.token.company_id;

        DBDevices.findAll(
            {
                attributes: ['googleappid', 'app_version', 'appid'],
                where: where,
                include: [{model: db.login_data, attributes: ['username'], required: true, where: {get_messages: true}}]
            }
        ).then(function(result) {
            if (!result || result.length === 0) {
                return res.status(401).send({
                    message: 'No devices found with these filters'
                });
            } else {
                var min_ios_version = (company_configurations.ios_min_version) ? parseInt(company_configurations.ios_min_version) : parseInt('1.3957040');
                var android_phone_min_version = (company_configurations.android_phone_min_version) ? parseInt(company_configurations.android_phone_min_version) : '1.1.2.2';
                var min_stb_version = (company_configurations.stb_min_version) ? parseInt(company_configurations.stb_min_version) : '2.2.2';
                var android_tv_min_version = (company_configurations.android_tv_min_version) ? parseInt(company_configurations.android_tv_min_version) : '6.1.3.0';
                for(var i=0; i<result.length; i++){
                    if(result[i].appid === 1 && result[i].app_version >= min_stb_version) var message = new push_msg.INFO_PUSH(req.body.title, req.body.message, '1', {});
                    else if(result[i].appid === 2 && result[i].app_version >= android_phone_min_version) var message = new push_msg.INFO_PUSH(req.body.title, req.body.message, '1',{});
                    else if(parseInt(result[i].appid) === parseInt('3') && parseInt(result[i].app_version) >= min_ios_version)
                        var message = new push_msg.INFO_PUSH(req.body.title, req.body.message, '1',{});
                    else if(result[i].appid === 4 && result[i].app_version >= android_tv_min_version) var message = new push_msg.INFO_PUSH(req.body.title, req.body.message, '1',{});
                    else if(['5', '6'].indexOf(result[i].appid))
                        var message = new push_msg.INFO_PUSH(req.body.title, req.body.message, '1',{});
                    else var message = {"action": "notification", "parameter1": req.body.message, "parameter2": req.body.message, "parameter3": ""};
                    push_msg.send_notification(result[i].googleappid, req.app.locals.backendsettings[req.token.company_id].firebase_key, result[i].login_datum.username, message, req.body.timetolive, true, true, function(result){});
                }
                return res.status(200).send({
                    message: 'Message sent'
                });
            }
        });
    }

};

/**
 * Send Message Actions, update, refresh, delete
 */

exports.send_message_action = function(req, res) {
    DBDevices.find(
        {
            where: {
                where: Sequelize.and(
                    {company_id: req.token.company_id},
                    Sequelize.or({
                        id: req.body.deviceid,
                        $or: [{appid: 1}, {appid: 2},{appid: 4} ]
                    })
                )
            }
        }
    ).then(function(result) {
        if (!result) {
            return res.status(401).send({
                message: 'UserName or Password does not match'
            });
        } else {
            push_msg.sendnotification(result,'some doemo message',5,req.body.messageaction, true, function(result){
                if(result){
                    return res.status(200).send({
                        message: 'messge send successful but not saved in database'
                    });
                }
                else {
                    return res.status(404).send({
                        message: 'messge not senddd'
                    });
                }
            });

        }
    });

};


/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.messages.company_id === req.token.company_id) res.json(req.messages);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.messages;

    if(req.messages.company_id === req.token.company_id){
        updateData.updateAttributes(req.body).then(function(result) {
            res.json(result);
        }).catch(function(err) {
            winston.error("Updating message failed with error: ", err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    }
    else{
        res.status(404).send({message: 'User not authorized to access these data'});
    }
};

/**
 * Delete
 */
exports.delete = function(req, res) {
    var deleteData = req.messages;

    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            if (result && (result.company_id === req.token.company_id)) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Deleting message failed with error: ", err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
                return null;
            }
            else{
                return res.status(400).send({message: 'Unable to find the Data'});
            }
        } else {
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
    }).catch(function(err) {
        winston.error("Finding message failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });

};

/**
 * List
 */
exports.list = function(req, res) {
    var qwhere = {},
        final_where = {},
        query = req.query;

    //start building where
    final_where.where = qwhere;
    if(parseInt(query._start)) final_where.offset = parseInt(query._start);
    if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
    if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
    final_where.include = [];

    final_where.where.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll(

        final_where

    ).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Getting message list failed with error: ", err);
        res.jsonp(err);
    });
};

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

    DBModel.find({
        where: {
            id: id
        },
        include: []
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.messages = result;
            next();
            return null;
        }
    }).catch(function(err) {
        winston.error("Getting message failed with error: ", err);
        return next(err);
    });

};