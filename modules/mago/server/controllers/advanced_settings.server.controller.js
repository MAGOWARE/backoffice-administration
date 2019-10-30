'use strict';

/**
 * Module dependencies.
 */
const path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
  winston = require('winston'),
  db = require(path.resolve('./config/lib/sequelize')).models,
  settings = require(path.resolve('./custom_functions/settings')),
  merge = require('merge'),
  DBModel = db.advanced_settings;

/**
 * Create
 */
exports.create = function (req, res) {
  logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(req.body));
  req.body.company_id = req.token.company_id; //save record for this company
  DBModel.create(req.body).then(function (result) {
    if (!result) {
      return res.status(400).send({message: 'fail create data'});
    } else {
      return res.jsonp(result);
    }
  }).catch(function (err) {
    winston.error("Creating a setting record failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  db.advanced_settings.findOne({
    where: {company_id: req.token.company_id}
  }).then(function(advanced_settings) {
    if (!advanced_settings) {
      res.status(404).send({status: false, message: "Advanced settings for that company not found"});
      return;
    }

    return advanced_settings.update({data: req.body}).then(function (result) {
      logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'created', JSON.stringify(result), req.token.company_id); //write new values in logs
      return settings.updateAdvancedSettings(result)
        .then(function () {
          res.json(result);
        }).catch(function (err) {
          winston.error("Updating advanced settings in memory failed with error", err);
          result.redis_update_failed = true;
          req.advancedsettings = result;
          res.json(result);
        })
    }).catch(function (err) {
      winston.error("Updating a setting record failed with error: ", err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
  })
};

/**
 * Delete
 */
exports.delete = function (req, res) {
  var deleteData = req.advancedsettings;

  DBModel.findById(deleteData.id).then(function (result) {
    if (result) {
      if (result && (result.company_id === req.token.company_id)) {
        result.destroy().then(function () {
          return res.json(result);
        }).catch(function (err) {
          winston.error("Deleting a setting record failed with error: ", err);
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });
        return null;
      } else {
        return res.status(400).send({message: 'Unable to find the Data'});
      }
    } else {
      return res.status(400).send({
        message: 'Unable to find the Data'
      });
    }
  }).catch(function (err) {
    winston.error("Finding a setting record failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


exports.getAdvancedSettings = function (req, res) {
  db.advanced_settings.findOne({
    where: {
      company_id: req.token.company_id
    },
    include: []
  }).then(function (result) {
    if (!result) {
      return res.status(404).send({
        message: 'No data with that identifier has been found'
      });
    } else {
      return res.jsonp(result);
    }
  }).catch(function (err) {
    winston.error("Getting a specific setting failed with error: ", err);
    return next(err);
  });
};