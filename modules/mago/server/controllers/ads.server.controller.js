var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    push_msg = require(path.resolve('./custom_functions/push_messages')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.commands,
    DBDevices = db.devices;
    var moment = require('moment');
var dateformat = require('dateformat');

/**
 * @api {post} /api/ads Push messages - Send ads
 * @apiVersion 0.2.0
 * @apiName Send ads
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 * @apiParam {Number} username  Field username.  If all_users is true, username can be left empty and is ignored.
 * @apiParam {boolean} all_users  Mandatory field all_users. Overrules field username.
 * @apiParam {Number[]} appid  Mandatory field appid. Cannot be an empty array.
 * @apiParam {String[]} activity  Mandatory field activity. Cannot be an empty array. Value "all" overrules other values. Value set ["all", "vod", "livetv"]
 * @apiParam {String} title  Optional field title.
 * @apiParam {String} message  Optional field message.
 * @apiParam {Number} duration  Optional field duration, in milliseconds. If empty, default value is 5000ms.
 * @apiParam {String} imageGif  Mandatory field imageGif.
 * @apiParam {String} link_url  Optional field link_url.
 * @apiParam {Number} xOffset  Mandatory field xOffset. Value set [1, 2, 3] stand for [top, center, bottom] respectively.
 * @apiParam {Datetime} delivery_time  Optional field delivery_time. If missing, the ad will be sent immediately
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "The ad will be sent in YYYY-MM-DD HH:mm:ss"
 *      }
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 OK
 *     {
 *       "message": "Error message" //for the actual message refer to list below
 *     }
 *
 *      "You did not select a position to display the ad" //xOffset is missing, empty or invalid
 *      "You did not select any device types" //appid is missing, empty or invalid
 *      "You have to add an image link for the ad" //imageGif is missing, empty or invalid
 *      "You did not select any devices" //username is missing, empty or invalid and all_users is missing, empty, invalid or false
 *      "You must select where the ads should appear" //activity is missing, empty or invalid
 *

 */

exports.create = function(req, res) {
    var title = (req.body.title) ? req.body.title : "";
    var message = (req.body.message) ? req.body.message : "";
    var yOffset = 1;
    var duration = (req.body.duration) ? req.body.duration.toString() : "5000"; //default value 5000ms
    var link_url = (req.body.link_url) ? req.body.link_url : "";
    var type = (req.body.type) ? req.body.type : 'textonly';
    var delivery_time = (!req.body.delivery_time) ? 0 : moment(req.body.delivery_time).format('x') - moment(Date.now()).format('x');
    if(req.body.xOffset) var xOffset =  req.body.xOffset;
    else return res.status(400).send({ message: "You did not select a position to display the ad" });

    if(req.body.activity) {
        var activity = "";
        for(var i=0; i<req.body.activity.length; i++) activity = (i<req.body.activity.length-1) ? (activity+req.body.activity[i]+",") : (activity+req.body.activity[i]);
        if(activity.search("all") !== -1) activity = "all"; //"all" overules other activities
    }

    if (req.body.appid && req.body.appid.length > 0) {
        var device_types = [];
        for(var j=0; j<req.body.appid.length; j++) device_types.push(parseInt(req.body.appid[j]));
    }
    else return res.status(400).send({ message: "You did not select any device types" });

    if(!req.body.imageGif) res.status(400).send({ message: "You have to add an image link for the ad" });
    else var imageGif = req.body.imageGif;

    var no_users = !!(req.body.all_users !== true && req.body.username === null); //no users selected, don't send push
    var no_device_type = !!(!device_types || device_types.length < 1); //no device types selected, don't send push
    if(no_users || no_device_type){
        return res.status(400).send({
            message: 'You did not select any devices'
        });
    }
    else if(activity.length < 1){
        return res.status(400).send({
            message: 'You must select where the ads should appear'
        });
    }
    else{
        var where = {}; //the device filters will be passed here
        if(req.body.all_users !== true) where.login_data_id = req.body.username; //if only one user is selected, filter devices of that user
        where.appid = {in: device_types};
        where.device_active = true;  //ads only sent to logged users

        setTimeout(function(){
            send_ad(where, title, message,  imageGif, xOffset, yOffset, duration, link_url, activity, req.app.locals.backendsettings[req.token.company_id].firebase_key, res, type);
        }, delivery_time);

        return res.status(200).send({
            message: 'The ad will be sent in '+moment(req.body.delivery_time).format("YYYY-MM-DD HH:mm:ss")
        });
    }
};

//returns list of commands stored in the database, for the listView
exports.list = function(req, res) {
    var query = {};
    var where = {};
    var join_where = {};

    if(req.query.status) where.status = req.query.status;
    if(req.query.command) where.command = {like: '%'+req.query.command+'%'};
    if(req.query.username) join_where.username = {like: '%'+req.query.username+'%'};

    query.attributes = ['id', 'googleappid', 'command', 'status', 'createdAt'];
    query.include = [{model: db.login_data, attributes: ['username'], required: true, where: join_where}];

    query.where = where;
    query.where.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll(query).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Getting the list of ads sent failed with error: ", err);
        res.jsonp(err);
    });
};

function send_ad(where, title, message,  imageGif, xOffset, yOffset, duration, link_url, activity, firebase_key, res, type){
    DBDevices.findAll(
        {
            attributes: ['googleappid', 'appid', 'app_version'],
            where: where,
            include: [{model: db.login_data, attributes: ['username'], required: true, raw: true, where: {get_messages: true}}]
        }
    ).then(function(devices) {
        if (!(!devices || devices.length === 0)) {
            var fcm_tokens = [];
            var users = [];
            for(var i=0; i<devices.length; i++){
                var push_object = new push_msg.CUSTOM_TOAST_PUSH(title, message, type, imageGif, xOffset, yOffset, duration, link_url, activity);
                push_msg.send_notification(devices[i].googleappid, firebase_key, devices[i].login_datum.dataValues.username, push_object, 5, true, true, function(devices) {
                    console.log("We are here at ad callback", devices)
                });
            }
        }
    });
}
