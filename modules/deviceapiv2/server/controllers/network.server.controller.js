/**
 * Author:    G. Lalaj
 * Created:   21-07.2016
 *
 * (c) Copyright by MAGOWARE
 **/

'use strict';
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    querystring = require("querystring"),
    models = db.models;
var winston = require('winston');

//makes a database call. returns database_error if connection failed, one genre_id otherwise

exports.dbtest = function(req, res) {
    models.genre.findAll({
        attributes: ['id'],
        limit: 1
    }).then(function (result) {
		response.send_res(req, res, result, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
    }).catch(function(error) {
		winston.error("Quering the genre table failed with error: ", error);
		response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
};


//REGISTERS GOOGLE APP ID FOR NEW DEVICES OR UPDATES IT FOR DEVICES THAT HAVE BEEN REGISTRED ALREADY. CALLED BEFORE AND AFTER LOGIN
/**
 * @api {POST} /apiv2/network/gcm Device Register
 * @apiName GCM
 * @apiGroup DeviceAPI
 *
 * @apiParam {Number} googleappid Users unique ID.
 * @apiParam {Number} boxid Users unique ID.
 * @apiParam {Number} macaddress Users unique ID.
 * @apiParam {Number} ntype Users unique ID.
 * @apiParam {Number} appid Users unique ID.
 * @apiParam {Number} appversion Users unique ID.
 * @apiParam {Number} devicebrand Users unique ID.
 * @apiParam {Number} os Users unique ID.
 * @apiParam {Number} screensize Users unique ID.
 * @apiParam {Number} devicebrand Users unique ID.
 * @apiParam {Number} hdmi Users unique ID.
 * @apiParam {Number} firmwareversion Users unique ID.
 * @apiParam {Number} api_version Users unique ID.
 * @apiParam {Number} language Users unique ID.
 *
 * @apiSuccess {Object} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status_code": 200,
 *       "error_code": -1,
 *       "timestamp": Date.now(),
 *       "error_description": 'OK',
 *       "extra_data": '',
 *       "response_object": []
 *   }
 *
 */
exports.gcm = function(req, res) {
	if(req.auth_obj.boxid == undefined){
		var auth_obj = querystring.parse(req.body.auth,";","=");

		upsertDevice({
			googleappid           : decodeURIComponent(req.body.google_app_id),
			device_id             : auth_obj.boxid,
			device_ip             : req.ip.replace('::ffff:', ''),
			device_mac_address    : (req.body.ntype == '2') ? decodeURIComponent(req.body.macaddress) : '',
			device_wifimac_address: (req.body.ntype == '1') ? decodeURIComponent(req.body.macaddress) : '',
			ntype                 : req.body.ntype,
			appid                 : req.body.appid,
			app_name              : (req.body.app_name) ? req.body.app_name : '',
			app_version           : req.body.appversion,
			device_brand          : decodeURIComponent(req.body.devicebrand),
			os                    : decodeURIComponent(req.body.os),
			screen_resolution     : req.body.screensize,
			hdmi				  : (req.body.hdmi=='true') ? 1 : 0,
			api_version           : req.body.api_version,
			firmware              : decodeURIComponent(req.body.firmwareversion),
			language              : req.body.language
		}).then(function(result){
			response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
			return null;
		}).catch(function(error) {
			winston.error("Creating / updating a device record failed with error: ", error);
			response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
		});

	}
	else {
		upsertDevice({
			googleappid           : decodeURIComponent(req.body.google_app_id),
			device_id             : req.auth_obj.boxid,
			device_ip             : req.ip.replace('::ffff:', ''),
			device_mac_address    : (req.body.ntype == '2') ? decodeURIComponent(req.body.macaddress) : '',
			device_wifimac_address: (req.body.ntype == '1') ? decodeURIComponent(req.body.macaddress) : '',
			ntype                 : req.body.ntype,
			appid                 : req.body.appid,
			app_name              : (req.body.app_name) ? req.body.app_name : '',
			app_version           : req.body.appversion,
			device_brand          : decodeURIComponent(req.body.devicebrand),
			os                    : decodeURIComponent(req.body.os),
			screen_resolution     : req.body.screensize,
			hdmi				  : (req.body.hdmi=='true') ? 1 : 0,
			api_version           : req.body.api_version,
			firmware              : decodeURIComponent(req.body.firmwareversion),
			language              : req.body.language
		}).then(function(result){
			response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
			return null;
		}).catch(function(error) {
			winston.error("Creating / updating a device record failed with error: ", error);
			response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
		});
	}
};


/**
 * @api {post} /apiv2/commands/response /apiv2/commands/response
 * @apiVersion 0.2.0
 * @apiName Device Command Response.
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} username Login username.
 * @apiParam {String} googleappid Device Registration ID.
 * @apiParam {String} message Command Response Message.
 * @apiParam {String} title Message Title.
 *
 * @apiDescription Internal use - commands execution response.
 */
exports.command_response = function(req,res) {

	req.body.action = 'receive';
	req.body.company_id = req.thisuser.company_id;

	models.messages.create(
		req.body
	).then(function(result){
		response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
		return null;
	}).catch(function(error) {
		winston.error("Creating a message record failed with error: ", error);
		response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
	});

};

function upsertDevice(device) {
	return new Promise(function(resolve, reject) {
		models.devices.findOne({
			where: {device_id: device.device_id}
		}).then(function(result) {
			if (!result) {
				return models.devices.create(device)
					.then(function() {
						resolve();
					})
					.catch(function(err) {
						reject(err);
					});
			}
			else {
				return result.update(device)
					.then(function() {
						resolve();
					})
					.catch(function(err) {
						reject(err);
					});
			}
		}).catch(function(err) {
			reject(err);
		});
	});
}