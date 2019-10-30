'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
  db = require(path.resolve('./config/lib/sequelize')).models,
  DBModel = db.systemmenu;

/**
 * Create
 */
exports.create = function(req, res) {

  if(!req.body.parent_menu_code) req.body.parent_menu_code = 'root';
  req.body.company_id = req.token.company_id; //save record for this company

  DBModel.create(req.body).then(function(result) {
    if (!result) {
      return res.status(400).send({message: 'failed to create data'});
    } else {
      return res.jsonp(result);
    }
  }).catch(function(err) {
    winston.error("Error at creating system menu instance, error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Show current
 */
exports.read = function(req, res) {
  if(req.systemmenu.company_id === req.token.company_id) res.json(req.systemmenu);
  else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
  var updateData = req.systemmenu;

  if(req.systemmenu.company_id === req.token.company_id){
    updateData.updateAttributes(req.body).then(function(result) {
      res.json(result);
    }).catch(function(err) {
      winston.error("Error at updating system menu, error: ", err);
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
  var deleteData = req.systemmenu;

  DBModel.findById(deleteData.id).then(function(result) {
    if (result) {
      if (result && (result.company_id === req.token.company_id)) {
        result.destroy().then(function() {
          return res.json(result);
        }).catch(function(err) {
          winston.error("Error at system menu delete, error: ",err);
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
    winston.error("Error at system menu delete, error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });

};

/**
 * List
 */
exports.list = function(req, res) {

  var qwhere = {},
      final_where = {},
      query = req.query;

  if(query.q) {
    qwhere.$or = {};
    qwhere.$or.description = {};
    qwhere.$or.description.$like = '%'+query.q+'%';
  }

  if(req.query.root === 'true') qwhere.parent_menu_code = 'root';

  //start building where
  final_where.where = qwhere;
  if(parseInt(query. _end) !== -1){
    if(parseInt(query._start)) final_where.offset = parseInt(query._start);
    if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
  }

  if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
  final_where.include = [];

  final_where.where.company_id = req.token.company_id; //return only records for this company

  DBModel.findAndCountAll(

      final_where

  ).then(function(results) {
    if (!results) {
      return res.status(404).send({
        message: 'No data found'
      });
    } else {

      res.setHeader("X-Total-Count", results.count);      
      res.json(results.rows);
    }
  }).catch(function(err) {
    winston.error("Error at listing system menu, error: ",err);
    res.jsonp(err);
  });
};

exports.list1 = function(req, res) {
  var final_where = {};

  //User.hasMany(Post, {foreignKey: 'user_id'})

  DBModel.hasMany(DBModel, {foreignKey: 'parent_menu_code'} );

  DBModel.findAndCountAll({
    attributes: ['id', 'parent_menu_code', 'title'],
    where: {parent_menu_code: 'root'},
    order: [['menu_order']],
    include: [{
                model: db.systemmenu,
                order: [['menu_order']],
    }]
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
    winston.error("Error at systemmenu list1, error: ", err);
    res.jsonp(err);
  });

}

/**
 * middleware
 */
exports.dataByID = function(req, res, next, id) {

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
      req.systemmenu = result;
      next();
      return null;
    }
  }).catch(function(err) {
    winston.error("Error at fetching dataById at systemmenu, error: ",err);
    return next(err);
  });

};
