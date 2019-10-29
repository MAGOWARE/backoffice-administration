//'use strict'
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    model = db.model,
    response = require(path.resolve("./config/responses.js")),
    models = db.models,
    dateFormat = require('dateformat'),
    push_msg = require(path.resolve('./custom_functions/push_messages')),
    scheduled_tasks = [];
var winston = winston = require(path.resolve('./config/lib/winston'));

function schedule_program(event_time, firebase_key, event_id, login_data_id, channel_number, program_id){
    try{
        scheduled_tasks[event_id] = setTimeout(function() {
            send_notification(event_time, firebase_key, login_data_id, channel_number, program_id)
        }, event_time);
    }
    catch(e){
        winston.error("Error at scheduling program, error: ", e);
    }
}

function unschedule_program(event_id){
    clearTimeout(scheduled_tasks[event_id]);
    delete scheduled_tasks[event_id];
}

function send_notification(event_time, firebase_key, login_data_id, channel_number, program_id){
    models.devices.findAll({
        attributes: ['googleappid', 'app_version', 'appid'],
        where: {login_data_id: login_data_id, device_active: true},
        include: [{model: models.login_data, attributes: ['username'], required: true}]
    }).then(function(devices) {
        if(!devices || devices.length < 0){

        }
        else{
            models.epg_data.findOne({
                attributes: ['id', 'channel_number', 'program_start', 'title', 'long_description'],
                where: {id: program_id}
            }).then(function (epg_program) {
                if(!epg_program || epg_program.length<0){
                    winston.info("No EPG records found at schedule.")
                }
                else{
                    var min_ios_version = (company_configurations.ios_min_version) ? parseInt(company_configurations.ios_min_version) : parseInt('1.3957040');
                    var android_phone_min_version = (company_configurations.android_phone_min_version) ? parseInt(company_configurations.android_phone_min_version) : '1.1.2.2';
                    var min_stb_version = (company_configurations.stb_min_version) ? parseInt(company_configurations.stb_min_version) : '2.2.2';
                    var android_tv_min_version = (company_configurations.android_tv_min_version) ? parseInt(company_configurations.android_tv_min_version) : '6.1.3.0';
                    for(var i=0; i<devices.length; i++){
                        if(devices[i].appid === 1 && devices[i].app_version >= min_stb_version)
                            var message = new push_msg.SCHEDULE_PUSH(epg_program.title, epg_program.long_description, '2', "scheduling", program_id.toString(), channel_number.toString(), event_time.toString());
                        else if(devices[i].appid === 2 && devices[i].app_version >= android_phone_min_version){
                            var message = new push_msg.SCHEDULE_PUSH(epg_program.title, epg_program.long_description, '2', "scheduling", program_id.toString(), channel_number.toString(), event_time.toString());
                        }
                        else if(parseInt(devices[i].appid) === parseInt('3') && parseInt(devices[i].app_version) >= min_ios_version)
                            var message = new push_msg.SCHEDULE_PUSH(epg_program.title, epg_program.long_description, '2', "scheduling", program_id.toString(), channel_number.toString(), event_time.toString());
                        else if(devices[i].appid === 4 && devices[i].app_version >= android_tv_min_version)
                            var message = new push_msg.SCHEDULE_PUSH(epg_program.title, epg_program.long_description, '2', "scheduling", program_id.toString(), channel_number.toString(), event_time.toString());
                        else if(['5', '6'].indexOf(devices[i].appid))
                            var message = new push_msg.SCHEDULE_PUSH(epg_program.title, epg_program.long_description, '2', "scheduling", program_id.toString(), channel_number.toString(), event_time.toString());
                        else var message = {
                                "event": "scheduling",
                                "program_id": program_id.toString(),
                                "channel_number": channel_number.toString(),
                                "event_time": event_time.toString(),
                                "program_name": epg_program.title,
                                "description": epg_program.long_description
                            };
                        push_msg.send_notification(devices[i].googleappid, firebase_key, devices[0].login_datum.username, message, 0, true, false, 0);
                    }

                }
            }).catch(function(error) {
                winston.error("Searching for the event failed with error: ", error);
            });
            return null;
        }
        return null;
    }).catch(function(error) {
        winston.error("Searching for devices failed with error: ", error);
    });


}

exports.reload_scheduled_programs = function() {
    var now = new Date();
    var current_time = dateFormat(now.setMinutes(now.getMinutes() + 5), "yyyy-mm-dd HH:MM:ss");

    models.epg_data.findAll({
        attributes: ['channel_number', 'program_start'],
        include: [{ model: models.program_schedule, required: true, attributes: ['id', 'login_id', 'program_id']}],
        where: {program_start: {gte: current_time}}
    }).then(function(result){
        //foreach record call schedule program
        for(var i = 0; i<result.length; i++){
            schedule_program(result[i].program_start.getTime() - Date.now() - 300000, result[i].program_schedules[0].id, result[i].program_schedules[0].login_id, result[i].channel_number, result[i].program_schedules[0].program_id);
        }
    }).catch(function(error){
        winston.error("Searching for all scheduled programs failed with error: ", error);
    });
}

//checks if there is a stored push event in local memory
exports.is_scheduled = function(event_id){
    if(!scheduled_tasks[event_id]) return false;
    else return true;
};

function end_subscription(login_id, ending_after, app_ids, screensize, activity, firebase_key){
    if(activity === 'livetv' && screensize === 1){
        try{
            livetv_l_subscription_end[login_id] = setTimeout(function(){
                send_action('termination', login_id, app_ids, firebase_key)
            }, ending_after);
        } catch(e){}
    }
    else if(activity === 'livetv' && screensize === 2){
        try{
            var theidinit = login_id;
            livetv_s_subscription_end[theidinit] = setTimeout(function(){
                //livetv_s_subscription_end[login_id] = setTimeout(function(){
                send_action('termination', login_id, app_ids, firebase_key)
            }, ending_after);
        } catch(e){}
    }
    else if(activity === 'vod' && screensize === 1){
        try{
            vod_l_subscription_end[login_id] = setTimeout(function(){
                send_action('termination', login_id, app_ids, firebase_key)
            }, ending_after);
        } catch(e){}
    }
    else{
        try{
            vod_s_subscription_end[login_id] = setTimeout(function(){
                send_action('termination', login_id, app_ids, firebase_key)
            }, ending_after);
        } catch(e){}
    }
}

function send_action(action, login_id, app_ids, firebase_key){
    models.devices.findOne({
        attributes: ['googleappid', 'username', 'app_version', 'appid'], where: {login_data_id: login_id, device_active: true, appid: {in: app_ids}}
    }).then(function(result){
        if(result) {
            var min_ios_version = (company_configurations.ios_min_version) ? parseInt(company_configurations.ios_min_version) : parseInt('1.3957040');
            var android_phone_min_version = (company_configurations.android_phone_min_version) ? parseInt(company_configurations.android_phone_min_version) : '1.1.2.2';
            var min_stb_version = (company_configurations.stb_min_version) ? parseInt(company_configurations.stb_min_version) : '2.2.2';
            var android_tv_min_version = (company_configurations.android_tv_min_version) ? parseInt(company_configurations.android_tv_min_version) : '6.1.3.0';
            for(var i=0; i<result.length; i++){
                if(result[i].appid === 1 && result[i].app_version >= min_stb_version) var message = new push_msg.ACTION_PUSH('Action', "Your subscription has ended", '5', "termination");
                else if(result[i].appid === 2 && result[i].app_version >= android_phone_min_version) var message = new push_msg.ACTION_PUSH('Action', "Your subscription has ended", '5', "termination");
                else if(parseInt(result[i].appid) === parseInt('3') && parseInt(result[i].app_version) >= min_ios_version)
                    var message = new push_msg.ACTION_PUSH('Action', "Your subscription has ended", '5', "termination");
                else if(result[i].appid === 4 && result[i].app_version >= android_tv_min_version) var message = new push_msg.ACTION_PUSH('Action', "Your subscription has ended", '5', "termination");
                else if(['5', '6'].indexOf(result[i].appid))
                    var message = new push_msg.ACTION_PUSH('Action', "Your subscription has ended", '5', "termination");
                else var message = {"action": "termination", "parameter1": "", "parameter2": "", "parameter3": ""};
                push_msg.send_notification(result.googleappid, firebase_key, result.username, message, 5, false, false, null);
            }
        }
    }).catch(function(error){
        winston.error("Searching for devices failed with error: ", error);
    });
}

exports.schedule_program = schedule_program;
exports.unschedule_program = unschedule_program;
exports.end_subscription = end_subscription;