'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
  db = require(path.resolve('./config/lib/sequelize')).models,
  crypto = require('crypto'),
  nodemailer = require('nodemailer'),
  DBModel = db.users,
  userFunctions = require(path.resolve('./custom_functions/user'));

/**
 * Create
 */
exports.create = function(req, res) {

  var user = DBModel.build(req.body);

  user.salt = user.makeSalt();

    user.company_id = req.token.company_id;

    var admin_id = 0;
    var superadmin_id = 0;

    db.groups.findAll({
        attributes: ['id', 'code'], where: {code: {$in: ['admin', 'superadmin']}}
    }).then(function(groups){
        if(groups && groups.length >0){
            for(var i=0; i<groups.length; i++){
                if(groups[i].code === 'admin') admin_id = groups[i].id;
                else superadmin_id = groups[i].id;
            }
            //non-admin/superadmin creating admins/superadmins is forbiden
            if( (['superadmin', 'admin'].indexOf(req.token.role) === -1) && ([admin_id, superadmin_id].indexOf(req.body.group_id) === -1) ){
                return res.status(400).send({message: 'Only superadmins and admins are authorized to create adminis / superadmins'});
            }
            else{
                user.save().then(function() {
                    res.json(user);
                }).catch(function(err) {
                    winston.error("Creating user failed with error: ", err);
                    res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
            }
        }
        else {
            return res.status(400).send({message: "Failed checking the user's authorization to perform this action"});
        }
    }).catch(function(){
        winston.error("Updating user failed with error: ", err);
        return res.status(400).send({message: errorHandler.getErrorMessage(err)});
    });


};
exports.reInvite = function(req, res) {
  db.users.findOne({
    where: {id: req.body.user_id}
  }).then(function(user) {
    if (!user) {
      res.status(404).send({status: false, message: 'User not found'});
      return;
    }

    if (user.invite_pending == false) {
      reject(new Error('User does not have a pending invite'));
      return;
    }

    return userFunctions.sendInvite(req, user)
      .then(function() {
        res.send({status: true, message: 'Invitation sent'});
      }).catch(function(err) {
        res.send({status: false, message: 'Invitation sending failed'});
      });
  }).catch(function(err) {
    res.status(500).send({status: false, message: 'Internal error'});
  })
}

exports.createAndInvite = function (req, res) {
    var admin_id = 0;
    var superadmin_id = 0;


    db.groups.findAll({
        attributes: ['id', 'code'], where: {code: {$in: ['admin', 'superadmin']}}
    }).then(function(groups){
        if(groups && groups.length >0){
            for(var i=0; i<groups.length; i++){
                if(groups[i].code === 'admin') admin_id = groups[i].id;
                else superadmin_id = groups[i].id;
            }
            if( (['superadmin', 'admin'].indexOf(req.token.role) === -1) && ([superadmin_id, admin_id].indexOf(req.body.group_id) === -1) ){
                return res.status(400).send({message: 'Only superadmins and admins are authorized to create adminis / superadmins'});
            }

            db.users.findOne({
                where: { email: req.body.email }
            }).then(function (user) {
                if (user) {
                  res.status(300).send({ status: false, message: 'User exist' });
                } else {
                    let userData = {
                        group_id: req.body.group_id,
                        username: req.body.email,
                        hashedpassword: crypto.randomBytes(4).toString('hex'),
                        email: req.body.email,
                        telephone: '',
                        jwtoken: '',
                        template: null,
                        isavailable: true,
                        third_party_api_token: '',
                        invite_pending: true
                    }

                    let userObj = db.users.build(userData);
                    userObj.salt = userObj.makeSalt();

                    if(req.token.role !== 'superadmin'){
                        userObj.company_id = req.token.company_id; //Make sure that only superadmins can choose the company freely. Other users can create accounts only for their company
                    } else{
                      userObj.company_id = req.body.company_id;
                    }

                    userObj.save().then(function (result) {
                        userFunctions.sendInvite(req, result) //send message to given email
                          .then(function() {
                            res.send({status: true, message: 'Invitation send successfully'});
                          }).catch(function(err) {
                            res.status(500).send({status: false, message: 'Invititation sending failed. Please use resend button to resend invite'});
                          })
                    }).catch(function (err) {
                        res.status(400).send({ status: false, message: err.message })
                    });
                }
            });
        }
        else {
            return res.status(400).send({message: "Failed checking the user's authorization to perform this action"});
        }
    }).catch(function(){
        winston.error("Updating user failed with error: ", err);
        return res.status(400).send({message: errorHandler.getErrorMessage(err)});
    });

}

/**
 * Show current
 */
exports.read = function(req, res) {
    if((req.users.company_id === req.token.company_id) || req.token.role === "superadmin") res.json(req.users);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.users;

    var admin_id = 0;
    var superadmin_id = 0;

    db.groups.findAll({
        attributes: ['id', 'code'], where: {code: {$in: ['admin', 'superadmin']}}
    }).then(function(groups){
        if(groups && groups.length >0){
            for(var i=0; i<groups.length; i++){
                if(groups[i].code === 'admin') admin_id = groups[i].id;
                else superadmin_id = groups[i].id;
            }

            if( (req.token.role!=='admin' && req.token.role!=='superadmin') && ( (updateData.group_id===superadmin_id || updateData.group_id===admin_id) || (updateData.company_id!==req.token.company_id) ) ){
                return res.status(400).send({message: 'You cannot update users above your hierarchy or of another company'}); //normal user trying to update outside his company or above his hierarchy
            }
            else if( (req.token.role==='admin') && ( (updateData.group_id===superadmin_id) || (updateData.company_id!==req.token.company_id) ) ){
                return res.status(400).send({message: 'You cannot update users above your hierarchy or of another company'}); //admin trying to update the superadmin or outside his company
            }
            else{
                updateData.updateAttributes(req.body).then(function(result) {
                    res.json(result);
                }).catch(function(err) {
                    winston.error("Updating user failed with error: ", err);
                    return res.status(400).send({message: errorHandler.getErrorMessage(err)});
                });
                return null;
            }
        }
        else {
            return res.status(400).send({message: "Failed checking the user's authorization to perform this action"});
        }
    }).catch(function(){
        winston.error("Updating user failed with error: ", err);
        return res.status(400).send({message: errorHandler.getErrorMessage(err)});
    });
};

/**
 * Delete
 */
exports.delete = function(req, res) {

    var deleteData = req.users;

    var admin_id = 0;
    var superadmin_id = 0;

    db.groups.findAll({
        attributes: ['id', 'code'], where: {code: {$in: ['admin', 'superadmin']}}
    }).then(function(groups){
        if(groups && groups.length >0){
            for(var i=0; i<groups.length; i++){
                if(groups[i].code === 'admin') admin_id = groups[i].id;
                else superadmin_id = groups[i].id;
            }
            DBModel.findById(deleteData.id).then(function(result) {
                if (result) {
                    if( (req.token.role!=='admin' && req.token.role!=='superadmin') && ( (req.users.group_id===superadmin_id || req.users.group_id===admin_id) || (req.users.company_id!==req.token.company_id) ) ){
                        return res.status(400).send({message: 'You cannot delete users above your hierarchy or of another company'}); //normal user trying to delete outside his company or above his hierarchy
                    }
                    else if( (req.token.role !== 'admin') && ( (req.users.group_id === superadmin_id) || (req.users.company_id !== req.token.company_id) ) ){
                        return res.status(400).send({message: 'You cannot update users above your hierarchy or of another company'}); //admin trying to delete the superadmin or outside his company
                    }
                    else{
                        result.destroy().then(function() {
                            return res.json(result);
                        }).catch(function(err) {
                            winston.error("Deleting user failed with error: ", err);
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(err)
                            });
                        });
                    }
                } else {
                    return res.status(400).send({message: 'Unable to find the Data'});
                }
            }).catch(function(err) {
                winston.error("Finding user to delete failed with error: ", err);
                return res.status(400).send({message: errorHandler.getErrorMessage(err)});
            });
        }
        else {
            return res.status(400).send({message: "Failed checking the user's authorization to perform this action"});
        }
    }).catch(function(){
        winston.error("Updating user failed with error: ", err);
        return res.status(400).send({message: errorHandler.getErrorMessage(err)});
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
    qwhere.$or.username = {};
    qwhere.$or.username.$like = '%'+query.q+'%';
    qwhere.$or.email = {};
    qwhere.$or.email.$like = '%'+query.q+'%';
    qwhere.$or.telephone = {};
    qwhere.$or.telephone.$like = '%'+query.q+'%';
  }

  //start building where
  final_where.where = qwhere;
  if(parseInt(query._start)) final_where.offset = parseInt(query._start);
  if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
  if(query._orderBy) final_where.order = query._orderBy + ' ' + query._orderDir;
  final_where.include = [];

    if(query.group_id) qwhere.group_id = query.group_id;
    if(query.company_id) qwhere.company_id = query.company_id;

    final_where.where.company_id = req.token.company_id;
    final_where.include = [
      {
        model: db.groups,
        required: true,
        attributes: ['code'],
      }
    ] 
      

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
    winston.error("Getting user list failed with error: ", err);
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
    include: [{model:db.groups}]
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
    winston.error("Finding user data failed with error: ", err);
    return next(err);
  });

};


/**
 * Change Password
 */
exports.changepassword = function(req, res, next) {
  // Init Variables
  var passwordDetails = req.body;
  var message = null;

  if (req.user) {
    if (passwordDetails.newPassword) {
      User.findById(req.user.id, function(err, user) {
        if (!err && user) {
          if (user.authenticate(passwordDetails.currentPassword)) {
            if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
              user.password = passwordDetails.newPassword;

              user.save(function(err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  req.login(user, function(err) {
                    if (err) {
                      res.status(400).send(err);
                    } else {
                      res.send({
                        message: 'Password changed successfully'
                      });
                    }
                  });
                }
              });
            } else {
              res.status(400).send({
                message: 'Passwords do not match'
              });
            }
          } else {
            res.status(400).send({
              message: 'Current password is incorrect'
            });
          }
        } else {
          res.status(400).send({
            message: 'User is not found'
          });
        }
      });
    } else {
      res.status(400).send({
        message: 'Please provide a new password'
      });
    }
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};
