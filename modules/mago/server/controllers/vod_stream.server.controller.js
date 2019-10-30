'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.vod_stream,
    refresh = require(path.resolve('./modules/mago/server/controllers/common.controller.js'))
/**
 * Create
 */
exports.create = function(req, res) {
    req.body.stream_resolution = req.body.stream_resolution.toString(); //convert array into comma-separated string
    req.body.company_id = req.token.company_id; //save record for this company
    DBModel.create(req.body).then(function(result) {
        if (!result) {
            winston.error("Failed to create vod_stream");
            return res.status(400).send({message: 'Failed to create vod_stream'});
        } else {
            return res.jsonp(result);
        }
    }).catch(function(err) {
        winston.error("Failed to create vod_stream, error: " + err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.vodStream.company_id === req.token.company_id) res.json(req.vodStream);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.vodStream;
    req.body.stream_resolution = req.body.stream_resolution.toString(); //convert array into comma-separated string

    if(req.vodStream.company_id === req.token.company_id){
        updateData.updateAttributes(req.body).then(function(result) {
            res.json(result);
        }).catch(function(err) {
            winston.error("Failed updating vod_stream attributes, error: " + err);
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
    var deleteData = req.vodStream;

    DBModel.findById(deleteData.id).then(function(result) {
        if (result) {
            if (result && (result.company_id === req.token.company_id)) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Failed deleting vod_stream, error: " + err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
            }
            else {
                return res.status(400).send({message: 'Unable to find the Data'});
            }
        } else {
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
        return null;
    }).catch(function(err) {
        winston.error("Failed operation at delete vod_stream, error: " + err);
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
    if (query.vod_id) qwhere.vod_id = query.vod_id;
    qwhere.company_id = req.token.company_id; //return only records for this company

    DBModel.findAndCountAll({
        where: qwhere,
        offset: offset_start,
        limit: records_limit,
        include: [db.vod_stream_source, db.vod]
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
        winston.error("Failed operation at list vod_stream, error: " + err);
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
        where: {id: id},
        include: [{model: db.vod_stream_source}, {model: db.vod}]
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.vodStream = result;
            req.vodStream.stream_resolution = JSON.parse("[" + req.vodStream.stream_resolution + "]");
            next();
            return null;
        }
    }).catch(function(err) {
        winston.error("Failed operation at dataById vod_stream, error: " + err);
        return next(err);
    });

};
