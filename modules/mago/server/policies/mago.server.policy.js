'use strict';

var path = require('path'),
    acl = require('acl'),
    apiGroups = require(path.resolve('./config/defaultvalues/api_group_url.json')),
    redis = require(path.resolve('./config/lib/redis')).client;

var jwt = require('jsonwebtoken'),
    jwtSecret = "thisIsMySecretPasscode",
    jwtIssuer = "mago-dev";

var db = require(path.resolve('./config/lib/sequelize')).models;

var async = require('async');
var winston = require('winston');

/**
 * Module dependencies.
 */

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Mago Tables Permissions
 */
exports.invokeRolesPolicies = function() {
    
    let aclList = [];

    db.settings.findAll()
        .then(function(companies) {
            async.forEach(companies, function(company, done) {
                db.groups.findAll({
                    where: {company_id: company.id}
                }).then(function(groups) {
                    async.forEach(groups, function(group, cb) {
                        //admin has access to all routes
                        if (group.code == 'admin') {
                            cb(null);
                            return;
                        }
            
                        setGroupRights(group, aclList)
                            .then(function(){
                                cb(null);
                            }).catch(function(err) {
                                throw err;
                            })
                    }, function(err) {
                        done()
                    });
                });
            }, function(err) {
                acl.allow(aclList);
            });
        });
};

exports.updateGroupRights = function(groupId) {
    return new Promise(function(resolve, reject) {
        db.groups.findOne({where: {id: groupId}})
        .then(function(group) {
            if (group) {

                acl.removeRole(group.code, function(err){
                    if(err) {
                        winston.error("Couldn't remove role, error: ", err);
                        resolve(false);
                        return;
                    }

                    let aclList = [];
                    setGroupRights(group, aclList).then(function() {
                        acl.allow(aclList);
                        resolve(true);
                    });
                })
            }
        });
    })
};

function setGroupRights(group, aclList) {
    return new Promise(function(resolve, reject) {
        db.grouprights.findAll({
            where: {group_id: group.id, allow: 1},
            include: [db.api_group]
        }).then(function(permissions) {
            //SAAS requires to distinguish which group is ownedd by which company
            let role = group.company_id +':' + group.code
            let aclEntry = {};
            aclEntry.roles =[role]
            aclEntry.allows = [];

            async.forEach(permissions, function(permission, cb){
                let aclSubEntry = {};
                aclSubEntry.permissions = ['*'];
                let api_urls = apiGroups[permission.api_group.api_group_name];
                if (!api_urls) {
                    throw new Error("Api group urls not found");
                }

                aclSubEntry.resources = api_urls;
                aclEntry.allows.push(aclSubEntry);
                cb(null);
                
            }, function(err){
                aclList.push(aclEntry);
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            })
        })
    })
}

/**
 * Read the user token
 */
exports.Authenticate = function(req, res, next) {
    var aHeader = req.get("Authorization");

    //Check if this request is signed by a valid token
    var token = null;
    if (typeof aHeader != 'undefined')
        token = aHeader;

    try {
        var decoded = jwt.verify(token, jwtSecret);
        req.token = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            message: 'User is not allowed'
        });
    }
}

/**
 * Check If Policy Allows
 */
exports.isAllowed = function(req, res, next) {
    if (req.token.role == 'superadmin') {
        next();
        return;
    }
    //check if user company is on track with billing
    let expire_date = req.app.locals.backendsettings[req.token.company_id].expire_date;

    if (expire_date.getTime() < Date.now()) {
        res.status(402).send('Company disabled due to payment');
        return;
    }
    
    let pathName = req.route.path.toLowerCase();
    let colonIndex = pathName.indexOf(':')
    if (colonIndex != -1) {
        pathName = pathName.substring(0, colonIndex);
    }

    if (apiGroups.whitelist.indexOf(pathName) != -1) {
        next();
        return;
    }

    var roles = (req.token) ? [req.token.company_id + ':' + req.token.role] : [req.token.company_id + ':guest'];

    //check if admin and give direct access to all routes
    if(req.token.role === 'admin') {
        next();
        return;
    }

    let permission = '*';

    acl.areAnyRolesAllowed(roles, pathName, permission, function(err, allowed) {
        if(err) {
            res.status(500).send('Unexpected authorization error');
            return;
        }

        if (allowed) {
            next();
        }
        else {
            res.status(403).send('User is not authorized to access this api')
        }
    })
    
};


// function to verify API KEY for third party integrations.

exports.isApiKeyAllowed = function(req, res, next) {

    let apikey = req.query.apikey;
    if (apikey == '') {
        res.status(403).json({message: 'API key not authorized'});
        return;
    }
    
    db.users.findOne({
        where: {
                jwtoken: apikey,
                isavailable: true
                }
    }).then(function(result) {
        if(result) {
           req.token = result;
           next()
        }
        else {
           return res.status(403).json({
            message: 'API key not authorized'
           });
        }
        return null;
    }).catch(function(err) {
        winston.error("Error at api key is not allowed, error: ",err);
        return res.status(404).json({
            message: 'API key not authorized'
        });
    });
}

exports.isSuperadmin = function (req, res, next) {
    if (req.token.role) {
        if (req.token.role == 'superadmin') {
            next();
        }
        else {
            res.status(403).send({message: 'User is not superadmin'});
        }
    } 
    else {
        db.groups.findOne({
            where: {id: req.token.group_id}
        }).then(function(group){
            if (!group) {
                res.status(404).send({message: 'User group not found. Cannot serve request'});
                return;
            }

            if (group.code == 'superadmin') {
                next();
            } else {
                res.status(403).send({message: 'User is not superadmin'})
            }
        });
    }
}
