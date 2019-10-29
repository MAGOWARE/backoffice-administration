var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    request = require("request");
var winston = require("winston");

function send_notification(fcm_token, firebase_key, user, message, ttl, push_message, save_message, callback) {
    //push payload is the same inside this function call
    if(message.data) {
        var is_info = (message.data.type === '1') ? true : false;
        var options = {
            url: 'https://fcm.googleapis.com/fcm/send',
            method: 'POST',
            headers: {
                'Authorization': "key="+firebase_key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "to": fcm_token,
                "data": message.data,
                "notification": message.notification
            })
        };
    }
    else {
        var is_info = (push_message && save_message) ? true : false;
        var payload = {
            "push_message": (push_message) ? "true" : "false",
            "EVENT": (message.event) ? message.event : "",
            "PROGRAM_ID": (message.event) ? message.program_id : "",
            "CHANNEL_NUMBER": (message.event) ? message.channel_number : "",
            "EVENT_TIME": (message.event) ? message.event_time : "",
            "program_name": (message.event) ? message.program_name : "",
            "program_description": (message.event) ? message.description : "",

            "COMMAND": (!push_message && message.command) ? message.command : "",
            "SOFTWARE_INSTALL": (!push_message && message.software_install) ? message.software_install : "",
            "DELETE_SHP": (!push_message && message.delete_shp) ? message.delete_shp : "",
            "DELETE_DATA": (!push_message && message.delete_data) ? message.delete_data : "",
            "URL_DOWNLOAD":"",
            "NAME":"",
            "ACTION" : (message.action) ? message.action : "",
            "PARAMETER1" : (message.parameter1) ? message.parameter1 : "", //param 1
            "PARAMETER2" : (message.parameter2) ? message.parameter2 : "", //param 2
            "PARAMETER3" : (message.parameter3) ? message.parameter3 : "" //options
        };

        //prepare request
        var options = {
            url: 'https://fcm.googleapis.com/fcm/send',
            method: 'POST',
            headers: {
                'Authorization': "key="+firebase_key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "to": fcm_token,
                "data": payload
            })
        };
    }

    request(options, function (error, response, body) {
        if(!error && body && is_info === true){
            if(JSON.parse(body) && (JSON.parse(body).success === 1)){
                var title = (!message.data) ? message.parameter1 : message.data.title;
                var description = (!message.data) ? message.parameter2 : message.data.body;
                exports.save_message(user, fcm_token, description, push_message, title); //save record for sent info messages
            }
        }
    });

}


function save_message(user, googleappid, message, action, title, company_id){

    db.messages.create({
        username: user,
        googleappid: googleappid,
        message: message,
        action: action,
        title: title,
        company_id: company_id
    }).then(function(result) {
        winston.info('Push notifications saved');
    }).catch(function(err) {
        winston.error("Error at creating push notification, error: ", err);
    });

}

function INFO_PUSH(title, body, type, parameters){
    return {
        data: {
            title   : title,
            body    : body,
            type    : type,
            values  : parameters
        },
        notification : {
            title   : title,
            body    : body
        }
    }
}

function SCHEDULE_PUSH(title, body, type, event, program_id, channel_number, event_time) {
    return {
        data: {
            title   : title,
            body    : body,
            type    : type,
            values  : {
                event          : event,
                program_id     : program_id,
                channel_number : channel_number,
                event_time     : event_time
            }
        },
        notification:  {
            title   : title,
            body    : body
        }
    };
}

function CUSTOM_TOAST_PUSH(title, message, type, imageGif, xOffset, yOffset, duration, link_url, activity) {
    return {
        data: {
            title   : title,
            body    : message,
            type    : type,
            values  : {
                imageGif : imageGif,
                xOffset  : xOffset,
                yOffset  : yOffset,
                duration : duration,
                link_url : link_url,
                activity : activity
            }
        },
        notification: {
            title   : title,
            body    : message
        }
    };
}

function COMMAND_PUSH(title, body, type, command, param1, param2, param3) {
    return {
        data: {
            title   : title,
            body    : body,
            type    : type,
            values  : {
                command : command,
                parameter1  : (param1 && param1 !== null) ? param1 : '',
                parameter2  : (param2 && param2 !== null) ? param2 : '',
                parameter3  : (param3 && param3 !== null) ? param3 : ''
            }
        },
        notification: {
            title   : title,
            body    : body
        }
    };
}

function ACTION_PUSH(title, body, type, action, parameters) {
    return {
        data: {
            title   : title,
            body    : body,
            type    : type,
            values  : {
                action : action,
                parameters : parameters
            }
        },
        notification: {
            title   : title,
            body    : body
        }
    };
}

exports.send_notification = send_notification;
exports.save_message = save_message;
exports.INFO_PUSH = INFO_PUSH;
exports.SCHEDULE_PUSH = SCHEDULE_PUSH;
exports.CUSTOM_TOAST_PUSH = CUSTOM_TOAST_PUSH;
exports.COMMAND_PUSH = COMMAND_PUSH;
exports.ACTION_PUSH = ACTION_PUSH;