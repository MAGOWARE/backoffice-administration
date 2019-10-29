'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.package_vod;

/**
 * Create
 */

exports.create = function(req, res) {

    req.body.company_id = req.token.company_id; //save record for this company
    DBModel.bulkCreate(req.body, {ignoreDuplicates: true}).then(function(result) {
        if (!result) {
            return res.status(400).send({message: 'fail create data'});
        } else {
            return res.jsonp(result);
        }
    }).catch(function(err) {
        winston.error("Adding vod item to package failed with error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};


/**
 * Show current
 */
/*
exports.read = function(req, res) {
 if(req.packageChannel.company_id === req.token.company_id) res.json(req.packageChannel);
 else return res.status(404).send({message: 'No data with that identifier has been found'});
};
*/

/**
 * Update
 */
/*
exports.update = function(req, res) {
    var updateData = req.packageChannel;

     if(req.packageChannel.company_id === req.token.company_id){
         updateData.updateAttributes(req.body).then(function(result) {
             res.json(result);
         }).catch(function(err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
         });
     }
     else{
     res.status(404).send({message: 'User not authorized to access these data'});
     }
};
*/

/**
 * Delete
 */

exports.delete = function(req, res) {
    var deleteData = req.packageChannel;

    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            if (result && (result.company_id === req.token.company_id)) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Removing vod item from package failed with error: ", err);
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
        winston.error("Error at delete package vod, error: ",err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });

};


/**
 * List
 */

exports.list = function(req, res) {

    var query = req.query;
    var offset_start = parseInt(query._start);
    var records_limit = query._end - query._start;
    var qwhere = {};
    if(query.package_id) qwhere.package_id = query.package_id;

    qwhere.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll({
        where: qwhere,
        offset: offset_start,
        limit: records_limit
    }).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {
            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Error at package vod list method, error: ",err);
        res.jsonp(err);
    });
};

/**
 * middleware
 */
/*
exports.dataByID = function(req, res, next, id) {
    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(404).send({ message: 'Data is invalid' });
    }

    DBModel.find({
        where: {
            id: id
        },
        include: [{model: db.vod, required: true}]
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.packageChannel = result;
            next();
            return null;
        }
    }).catch(function(err) {
        return next(err);
    });

};
*/