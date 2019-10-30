'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.groups;

/**
 * Create
 */
exports.create = function(req, res) {
    req.body.company_id = req.token.company_id; //save record for this company

    DBModel.create(req.body).then(function(result) {
        if (!result) {
            return res.status(400).send({message: 'fail create data'});
        } else {
            return res.jsonp(result);
        }
    }).catch(function(err) {
        winston.error("Creating group failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * Show current
 */
exports.read = function(req, res) {
    if( (req.users.company_id === req.token.company_id) || (req.token.company_id === -1) ) res.json(req.users);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.users;

    if( (req.users.company_id === req.token.company_id) || (req.token.company_id === -1) ){
        updateData.updateAttributes(req.body).then(function(result) {
            res.json(result);
        }).catch(function(err) {
            winston.error("Updating group failed with error: ", err);
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
    var deleteData = req.users;

    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            if ( (result && (result.company_id === req.token.company_id) ) || (req.token.company_id === -1) ) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Deleting group failed with error: ", err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
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
        winston.error("Finding group failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });

};

/**
 * List
 */
exports.list = function(req, res) {

  const query = req.query;
  const offset_start = parseInt(query._start);
  const records_limit = query._end - query._start;

  const where = {company_id: req.token.company_id};

  if (query.filter_reserved_groups === 'true') {
    where.code = {$notIn: ['superadmin', 'admin']}
  }

  DBModel.findAndCountAll({
    where: where,
    include: []
  }).then(function (results) {
    if (!results) {
      return res.status(404).send({
        message: 'No data found'
      });
    } else {

      res.setHeader("X-Total-Count", results.count);
      res.json(results.rows);
    }
  }).catch(function (err) {
    winston.error("Getting group list failed with error: ", err);
    res.jsonp(err);
  });
};

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({
            message: 'Data is invalid'
        });
    }

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
            req.users = result;
            next();
            return null;
        }
    }).catch(function(err) {
        winston.error("Getting group data failed with error: ", err);
        return next(err);
    });

};
