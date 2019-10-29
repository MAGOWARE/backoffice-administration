'use strict';
var path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  response = require(path.resolve("./config/responses.js")),
  password_encryption = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller.js')),
  push_msg = require(path.resolve('./custom_functions/push_messages')),
  models = db.models;
var async = require("async");
var winston = require('winston');


//todo: remove , replaced by loginv2
/**
 * @api {post} /apiv2/credentials/login /apiv2/credentials/login
 * @apiVersion 0.2.0
 * @apiName DeviceLogin
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} username Customers login username.
 * @apiParam {String} password Customers login password.
 * @apiParam {String} boxid Unique device ID.
 *
 * @apiDescription If token is not present, plain text values are used to login
 */
exports.login = function (req, res) {
  var appids = [];
  const COMPANY_ID = req.thisuser.company_id || 1;

  if (req.auth_obj.username === 'guest') {
    models.devices.upsert({
      company_id: req.thisuser.company_id,
      device_active: true,
      login_data_id: req.thisuser.id,
      username: req.auth_obj.username,
      device_mac_address: decodeURIComponent(req.body.macaddress),
      appid: req.auth_obj.appid,
      app_name: (req.body.app_name) ? req.body.app_name : '',
      app_version: req.body.appversion,
      ntype: req.body.ntype,
      device_id: req.auth_obj.boxid,
      hdmi: (req.body.hdmi == 'true') ? 1 : 0,
      firmware: decodeURIComponent(req.body.firmwareversion),
      device_brand: decodeURIComponent(req.body.devicebrand),
      screen_resolution: decodeURIComponent(req.body.screensize),
      api_version: decodeURIComponent(req.body.api_version),
      device_ip: req.ip.replace('::ffff:', ''),
      os: decodeURIComponent(req.body.os)
    }).then(function (result) {
      var response_data = [{
        "encryption_key": req.app.locals.backendsettings[req.thisuser.company_id].new_encryption_key,
        "company_id": req.thisuser.company_id
      }];
      response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
    }).catch(function (error) {
      winston.error("Creating / updating the device record for guest account failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_1', 'DATABASE_ERROR_DATA', 'no-store');
    });
  } else {
    models.app_group.findOne({
      attributes: ['app_group_id'],
      where: {app_id: req.auth_obj.appid}
    }).then(function (result) {
      models.app_group.findAll({
        attributes: ['app_id'],
        where: {app_group_id: result.app_group_id}
      }).then(function (result) {
        for (var i = 0; i < result.length; i++) {
          appids.push(result[i].app_id);
        }


        let max_multilogin_nr = req.thiscompany.filter(function (obj) {
          return obj.parameter_id === "max_multilogin_nr"
        })[0].parameter_value;


        //find all active devices for this user, where
        models.login_data.findOne({
          where: {username: req.auth_obj.username, company_id: COMPANY_ID},
          attributes: ['id', 'username', 'password', 'account_lock', 'salt']
        }).then(function (users) {


          models.devices.findOne({
            where: {username: req.auth_obj.username, device_active: true, appid: {in: appids}}
          }).then(function (device) {
            //if record is found then device is found
            if (device) {
              if (req.auth_obj.boxid == device.device_id) {
                //same user login on same device
                //update value of device_active, since a user is loging into this device
                device.updateAttributes({
                  login_data_id: users.id,
                  company_id: req.thisuser.company_id,
                  username: req.auth_obj.username,
                  device_mac_address: decodeURIComponent(req.body.macaddress),
                  appid: req.auth_obj.appid,
                  app_name: (req.body.app_name) ? req.body.app_name : '',
                  app_version: req.body.appversion,
                  ntype: req.body.ntype,
                  device_id: req.auth_obj.boxid,
                  hdmi: (req.body.hdmi == 'true') ? 1 : 0,
                  firmware: decodeURIComponent(req.body.firmwareversion),
                  device_brand: decodeURIComponent(req.body.devicebrand),
                  screen_resolution: decodeURIComponent(req.body.screensize),
                  api_version: decodeURIComponent(req.body.api_version),
                  device_ip: req.ip.replace('::ffff:', ''),
                  os: decodeURIComponent(req.body.os)
                }).then(function (result) {
                  var response_data = [{
                    "encryption_key": req.app.locals.backendsettings[req.thisuser.company_id].new_encryption_key,
                    "company_id": req.thisuser.company_id,
                    "password_hash": req.thisuser.password
                  }];
                  response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
                  return null;
                }).catch(function (error) {
                  winston.error("Updating a device's record failed with error: ", error);
                  response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_2', 'DATABASE_ERROR_DATA', 'no-store');
                });
              } else {
                response.send_res(req, res, [], 705, -1, 'DUAL_LOGIN_ATTEMPT_DESCRIPTION', 'DUAL_LOGIN_ATTEMPT_DATA', 'no-store'); //same user try to login on another device
                return null;
              }
            } else {
              //fist time login, register on the database
              models.devices.upsert({
                device_active: true,
                login_data_id: users.id,
                company_id: req.thisuser.company_id,
                username: req.auth_obj.username,
                device_mac_address: decodeURIComponent(req.body.macaddress),
                appid: req.auth_obj.appid,
                app_name: (req.body.app_name) ? req.body.app_name : '',
                app_version: req.body.appversion,
                ntype: req.body.ntype,
                device_id: req.auth_obj.boxid,
                hdmi: (req.body.hdmi == 'true') ? 1 : 0,
                firmware: decodeURIComponent(req.body.firmwareversion),
                device_brand: decodeURIComponent(req.body.devicebrand),
                screen_resolution: decodeURIComponent(req.body.screensize),
                api_version: decodeURIComponent(req.body.api_version),
                device_ip: req.ip.replace('::ffff:', ''),
                os: decodeURIComponent(req.body.os)
              }).then(function (result) {
                var response_data = [{
                  "encryption_key": req.app.locals.backendsettings[req.thisuser.company_id].new_encryption_key,
                  "company_id": req.thisuser.company_id,
                  "password_hash": req.thisuser.password
                }];
                response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
                return null;
              }).catch(function (error) {
                winston.error("Creating / updating a device record failed with error: ", error);
                response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_3', 'DATABASE_ERROR_DATA', 'no-store');
              });

            }
            return null;
          }).catch(function (error) {
            winston.error("Searching for the logged device failed with error: ", error);
            response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_4', 'DATABASE_ERROR_DATA', 'no-store');
          });
          return null;
        }).catch(function (error) {
          winston.error("Searching for the credentials of the client's account failed with error: ", error);
          response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_5', 'DATABASE_ERROR_DATA', 'no-store');
        });
        //login end
        return null;
      }).catch(function (error) {
        winston.error("Searching for the app group's appid failed with error: ", error);
        response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_6', 'DATABASE_ERROR_DATA', 'no-store');
      });
      return null;
    }).catch(function (error) {
      winston.error("Searching for the app group's data failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_7', 'DATABASE_ERROR_DATA', 'no-store');
    });
  }
};

/**
 * @api {post} /apiv2/credentials/logout /apiv2/credentials/logout
 * @apiVersion 0.2.0
 * @apiName DeviceLogout
 * @apiGroup DeviceAPI
 *
 * @apiHeader {String} auth Users unique access-key.
 * @apiDescription Removes check box from device so user can login on another device
 */
exports.logout = function (req, res) {
  models.devices.update(
    {
      device_active: false
    },
    {
      where: {username: req.auth_obj.username, appid: req.auth_obj.appid, company_id: req.thisuser.company_id}
    }).then(function (result) {
    response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
  }).catch(function (error) {
    winston.error("Setting device inactive failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};

/**
 * @api {post} /apiv2/credentials/logout_user /apiv2/credentials/logout_user
 * @apiVersion 0.2.0
 * @apiName LogoutUser
 * @apiGroup DeviceAPI
 * @apiParam {String} auth Encrypted authentication token string.
 * @apiDescription Logs user out of devices of the same group as this. (Updates device_active flag to false, sends push notification to log user out)
 * @apiSuccessExample Success-Response:
 *     {
 *       "status_code": 200,
 *       "error_code": 1,
 *       "timestamp": 1,
 *       "error_description": "OK",
 *       "extra_data": "LOGOUT_OTHER_DEVICES",
 *       "response_object": []
 *      }
 * @apiErrorExample Error-Response:
 *     {
 *       "status_code": 704,
 *       "error_code": -1,
 *       "timestamp": 1,
 *       "error_description": "REQUEST_FAILED",
 *       "extra_data": "Error processing request",
 *       "response_object": []
 *     }
 * @apiErrorExample Error-Response:
 *     {
 *       "status_code": 704,
 *       "error_code": -1,
 *       "timestamp": 1,
 *       "error_description": "REQUEST_FAILED",
 *       "extra_data": "Unable to find any device with the required specifications",
 *       "response_object": []
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
 */
exports.logout_user = function (req, res) {
  var appids = []; //will store appids of devices of the same type

  //find type of device
  models.app_group.findOne({
    attributes: ['app_group_id'],
    where: {app_id: req.auth_obj.appid}
  }).then(function (result) {
    //find appids of the same group as this one
    models.app_group.findAll({
      attributes: ['app_id'],
      where: {app_group_id: result.app_group_id}
    }).then(function (result) {
      for (var i = 0; i < result.length; i++) appids.push(result[i].app_id); //appids stored into variable appids[]
      models.devices.findOne({
        where: {
          username: req.auth_obj.username,
          device_active: true,
          appid: {in: appids},
          login_data_id: req.thisuser.id
        }, //keshtu u ndryhsua, 16-7
        order: [['updatedAt', 'ASC']] //first record
      }).then(function (onedevice) {
        //log this user out of the devices of this group

        if (!onedevice) {
          return response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'LOGOUT_OTHER_DEVICES', 'no-store');
        } else {
          onedevice.device_active = false;
          onedevice.save().then(function (result) {
            var message = new push_msg.ACTION_PUSH('Action', "You have been logged in another device", '5', "logout_user");
            push_msg.send_notification(onedevice.googleappid, req.app.locals.backendsettings[req.thisuser.company_id].firebase_key, '', message, 5, false, true, function (result) {
            });
            response.send_res(req, res, [], 200, 1, 'OK_DESCRIPTION', 'LOGOUT_OTHER_DEVICES', 'no-store');
          });
        }
        return null;
      }).catch(function (error) {
        winston.error("Getting a list of googleappids failed with error: ", error);
        response.send_res(req, res, [], 704, -1, 'REQUEST_FAILED', 'DEVICE_NOT_FOUND', 'no-store');
      });
      return null;
    }).catch(function (error) {
      winston.error("Finding the appid of an app group failed with error: ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
    return null;
  }).catch(function (error) {
    winston.error("Finding the app group's data failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });

};

//Sends an action push message to all active devices where this user is loged in
exports.lock_account = function lock_account(login_id, username) {

  models.devices.findAll({
    attributes: ['googleappid', 'app_version', 'appid', 'company_id'],
    where: {login_data_id: login_id, device_active: true}
  }).then(function (result) {
    if (result && result.length > 0) {
      var min_ios_version = (company_configurations.ios_min_version) ? parseInt(company_configurations.ios_min_version) : parseInt('1.3957040');
      var android_phone_min_version = (company_configurations.android_phone_min_version) ? parseInt(company_configurations.android_phone_min_version) : '1.1.2.2';
      var min_stb_version = (company_configurations.stb_min_version) ? parseInt(company_configurations.stb_min_version) : '2.2.2';
      var android_tv_min_version = (company_configurations.android_tv_min_version) ? parseInt(company_configurations.android_tv_min_version) : '6.1.3.0';
      for (var i = 0; i < result.length; i++) {
        if (result[i].appid === 1 && result[i].app_version >= min_stb_version) var message = new push_msg.ACTION_PUSH('Action', "Your account was locked", '5', "lock_account");
        else if (result[i].appid === 2 && result[i].app_version >= android_phone_min_version) var message = new push_msg.ACTION_PUSH('Action', "Your account was locked", '5', "lock_account");
        else if (parseInt(result[i].appid) === parseInt('3') && parseInt(result[i].app_version) >= min_ios_version)
          var message = new push_msg.ACTION_PUSH('Action', "Your account was locked", '5', "lock_account");
        else if (result[i].appid === 4 && result[i].app_version >= android_tv_min_version) var message = new push_msg.ACTION_PUSH('Action', "Your account was locked", '5', "lock_account");
        else if (['5', '6'].indexOf(result[i].appid))
          var message = new push_msg.ACTION_PUSH('Action', "Your account was locked", '5', "lock_account");
        else var message = {"action": "lock_account", "parameter1": "", "parameter2": "", "parameter3": ""};
        push_msg.send_notification(result[i].googleappid, req.app.locals.backendsettings[result[i].company_id].firebase_key, username, message, 5, false, true, function (result) {
        });
      }
    }
  }).catch(function (error) {
    winston.error("Getting a list of device data failed with error: ", error);
  });

};

/**
 * @api {get} /apiv2/credentials/company_list GetCompanyList
 * @apiName GetCompanyList
 * @apiGroup DeviceAPI
 *
 * @apiUse header_auth
 *
 *@apiDescription Returns list of companies that have a an account with this username
 *
 * Copy paste this auth for testing purposes
 *auth=%7Bapi_version%3D22%2C+appversion%3D1.1.4.2%2C+screensize%3D480x800%2C+appid%3D2%2C+devicebrand%3D+SM-G361F+Build%2FLMY48B%2C+language%3Deng%2C+ntype%3D1%2C+app_name%3DMAGOWARE%2C+device_timezone%3D2%2C+os%3DLinux%3B+U%3B+Android+5.1.1%2C+auth%3D8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl%0A47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG%2FFoT9fEw4CrxF%0A%2C+hdmi%3Dfalse%2C+firmwareversion%3DLMY48B.G361FXXU1APB1%7D
 *
 */
exports.company_list = function (req, res, next) {

  models.login_data.findAll({
    attributes: ['id', 'username', 'password', 'salt', 'company_id'],
    where: {username: req.auth_obj.username},
    include: [{model: models.settings, attributes: ['id', 'company_name', 'new_encryption_key'], required: true}]
  }).then(function (companies) {

    if (!companies) {
      response.send_res_get(req, res, [], 704, -1, 'WRONG_PASSWORD_DESCRIPTION', 'WRONG_PASSWORD_DATA', 'no-store');
    } else {
      var company_list = [];
      for (var i = 0; i < companies.length; i++) {
        if (password_encryption.encryptPassword(req.auth_obj.password, companies[i].salt) == companies[i].password) {
          company_list.push(companies[i].setting);
        }
      }

      //if no password match
      if (company_list.length == 0) {
        response.send_res_get(req, res, [], 704, -1, 'WRONG_PASSWORD_DESCRIPTION', 'WRONG_PASSWORD_DATA', 'no-store');
      }
      //if one password match
      else if (company_list.length == 1) {
        req.auth_obj.company_id = companies[0].setting.id;
        req.body.company_id = companies[0].setting.id;
        req.body.isFromCompanyList = true;
        req.url = '/apiv2/credentials/login';
        return req.app._router.handle(req, res, next);
      } else {
        response.send_res_get(req, res, company_list, 300, 1, 'OK_DESCRIPTION', 'OK_DATA', 'private,max-age=86400');
      }
    }

  }).catch(function (error) {
    winston.error("Finding the list of companies for this user failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
  });
};


//improved function to controll login on multiple devices per screen size.
/**
 * @api {post} /apiv2/credentials/login /apiv2/credentials/login
 * @apiVersion 0.2.0
 * @apiName DeviceLogin
 * @apiGroup DeviceAPI
 *
 * @apiParam {String} username Customers login username.
 * @apiParam {String} password Customers login password.
 * @apiParam {String} boxid Unique device ID.
 *
 * @apiDescription If token is not present, plain text values are used to login
 */
exports.loginv2 = function (req, res) {
  models.app_group.findOne({
    attributes: ['app_group_id'],
    where: {app_id: req.auth_obj.appid}
  }).then(function (app_group) {
    models.devices.findAll({
      where: {username: req.auth_obj.username, device_active: true, device_id: {not: req.auth_obj.boxid}}
    }).then(function (device) {

      var max_multilogin_nr = req.app.locals.advanced_settings[req.thisuser.company_id].auth.max_logins;

      if (!device || device.length < Number(max_multilogin_nr)) {
        upsertDevice({
          device_active: true,
          login_data_id: req.thisuser.id,
          username: req.auth_obj.username,
          device_mac_address: decodeURIComponent(req.body.macaddress),
          appid: req.auth_obj.appid,
          app_name: (req.body.app_name) ? req.body.app_name : '',
          app_version: req.body.appversion,
          ntype: req.body.ntype,
          device_id: req.auth_obj.boxid,
          hdmi: (req.body.hdmi == 'true') ? 1 : 0,
          firmware: decodeURIComponent(req.body.firmwareversion),
          device_brand: decodeURIComponent(req.body.devicebrand),
          screen_resolution: decodeURIComponent(req.body.screensize),
          api_version: decodeURIComponent(req.body.api_version),
          device_ip: req.ip.replace('::ffff:', ''),
          os: decodeURIComponent(req.body.os),
          language: req.body.language,
          company_id: req.thisuser.company_id

          //googleappid:        req.body.googleappid
        }).then(function (result) {
          var response_data = [{
            "encryption_key": req.app.locals.backendsettings[req.thisuser.company_id].new_encryption_key,
            "company_id": req.thisuser.company_id,
            "password_hash": req.thisuser.password
          }];
          response.send_res(req, res, response_data, 200, 1, 'OK_DESCRIPTION', 'OK_DATA', 'no-store');
          return null;
        }).catch(function (error) {
          winston.error("device upsert error : ", error);
          response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
      } else {
        response.send_res(req, res, [], 705, -1, 'DUAL_LOGIN_ATTEMPT_DESCRIPTION', 'DUAL_LOGIN_ATTEMPT_DATA', 'no-store'); //same user try to login on another device
      }
      return null;
    }).catch(function (error) {
      winston.error("database error device search : ", error);
      response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    });
    return null;
  }).catch(function (error) {
    winston.error("Searching for the app group's data failed with error: ", error);
    response.send_res(req, res, [], 706, -1, 'DATABASE_ERROR_DESCRIPTION_7', 'DATABASE_ERROR_DATA', 'no-store');
  });

};

function upsertDevice(device) {
  return new Promise(function (resolve, reject) {
    models.devices.findOne({
      where: {device_id: device.device_id}
    }).then(function (result) {
      if (!result) {
        return models.devices.create(device)
          .then(function () {
            resolve();
          })
          .catch(function (err) {
            reject(err);
          });
      } else {
        return result.update(device)
          .then(function () {
            resolve();
          })
          .catch(function (err) {
            reject(err);
          });
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}