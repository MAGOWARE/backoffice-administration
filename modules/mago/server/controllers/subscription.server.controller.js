'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  logHandler = require(path.resolve('./modules/mago/server/controllers/logs.server.controller')),
    winston = require('winston'),
  subscriptionFunctions = require(path.resolve('./custom_functions/sales.js')),
    crypto = require("crypto"),
  moment = require('moment'),
  db = require(path.resolve('./config/lib/sequelize')).models,
  DBModel = db.subscription,
  Combo = db.combo,
  LoginData = db.login_data,
  SalesData = db.salesreport;


/**
 * @api {post} /api/subscriptions Add subscription
 * @apiVersion 0.2.0
 * @apiName Add subscription
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 * @apiParam {Number} login_id  Mandatory field login_id.
 * @apiParam {Number} combo_id  Mandatory field combo_id.
 * @apiParam {Number} value  Mandatory field value
 * @apiParam {Number} duration  Mandatory field duration
 * @apiParam {String} start_date  Mandatory field start_date.
 *
 * @apiSuccess (200) {String} message Record created successfuly
 * @apiError (40x) {String} message Error message on creating the user account.
 *

 */
exports.create = function(req, res) {

  req.body.company_id = req.token.company_id;
  req.body.login_data_id = req.body.login_id;
  var sale_or_refund = 1;

  if (!req.body.transaction_id) req.body.transaction_id = crypto.randomBytes(16).toString('base64');

  subscriptionFunctions.add_subscription_transaction(req, res, sale_or_refund, req.body.transaction_id,req.body.start_date).then(function (result) {
    if (result.status) {
        result.user = req.body.login_id;
      res.send(result);
    }
    else {
      res.status(300).send(result);
    }
  });

};



/**
 * Show current
 */
exports.read = function(req, res) {
  if(req.subscription.company_id === req.token.company_id) res.json(req.subscription);
  else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * @api {put} /api/subscriptions/id Update Subscription
 * @apiVersion 0.2.0
 * @apiName Update Subscription
 * @apiGroup Backoffice
 * @apiHeader {String} authorization Token string acquired from login api.
 * @apiParam {String} start_date  Optional field start_date.
 * @apiParam {String} end_date  Optional field end_date.
 * @apiSuccess (200) {String} message Json of updated record
 * @apiError (40x) {Text} message {
 * "message": informing_message
 * }
 *

 */
exports.update = function(req, res) {
  var updateData = req.subscription;

  if(req.subscription.company_id === req.token.company_id){
    updateData.updateAttributes(req.body).then(function(result) {
      logHandler.add_log(req.token.id, req.ip.replace('::ffff:', ''), 'update sub', JSON.stringify(req.body));
      return res.json(result);
    }).catch(function(err) {
      winston.error("Updating subscription failed with error: ", err);
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
  var deleteData = req.subscription;

  DBModel.findById(deleteData.id).then(function(result) {
    if (result) {
      if (result && (result.company_id === req.token.company_id)) {
        result.destroy().then(function() {
          return res.json(result);
        }).catch(function(err) {
          winston.error("Deleting subscription failed with error: ", err);
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
    winston.error("Finding subscription object failed with error: ", err);
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
  var qwhere = {};
  var user_qwhere = {};
  if(query.login_id) qwhere.login_id = query.login_id;
  //Ensures that subscription records are paginated
  if(parseInt(query._start)) var offset_start = parseInt(query._start);
  if(parseInt(query._end)) var records_limit = parseInt(query._end)-parseInt(query._start);

  if(query.q) {
    user_qwhere.$or = {};
    user_qwhere.$or.username = {};
    user_qwhere.$or.username.$like = '%'+query.q+'%';
  }

  qwhere.company_id = req.token.company_id; //return only records for this company

  DBModel.findAndCountAll({
    where: qwhere,
    order: 'login_id DESC',
    include: [{model:db.login_data, where: user_qwhere, required: true}, {model:db.package, required: true}],
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
    winston.error("Getting subscription list failed with error: ", err);
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
    include: [{model: db.login_data}, {model: db.package}]
  }).then(function(result) {
    if (!result) {
      return res.status(404).send({
        message: 'No data with that identifier has been found'
      });
    } else {
      req.subscription = result;
      next();
      return null;
    }
  }).catch(function(err) {
    winston.error("Finding subscription data failed with error: ", err);
    return next(err);
  });

};
