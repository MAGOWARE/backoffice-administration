'use strict';

var jwt = require('jsonwebtoken'),
    jwtSecret = "thisIsMySecretPasscode",
    jwtIssuer = "MAGOWARE";

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    winston = require('winston'),
    sequelize = require('sequelize'),
    async = require('async'),
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    config = require(path.resolve('./config/config')),
    dbAdmin = require(path.resolve('./config/lib/sequelize')),
    DBModel = db.users,
    sendEmail = require(path.resolve('./custom_functions/sendEmail'));

var async = require('async');


/**
 * @api {post} /api/auth/login /api/auth/login
 * @apiVersion 0.2.0
 * @apiName System User Login
 * @apiGroup Backoffice
 * @apiParam {String} username  Mandatory username field.
 * @apiParam {String} password  Mandatory password field.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "the.token.string"
 *     }
 * @apiError (40x) {String} message wrong username or password
 */

exports.authenticate = function (req, res) {

    var authBody = req.body;
    DBModel.findOne(
        {
            where: {
                username: authBody.username,
                isavailable: true
            },
            include: [{model: db.groups, required: true}]
        }
    ).then(function (result) {
            if (!result) {
                return res.status(404).send({
                    message: 'UserName or Password does not match'
                });
            } else {

                if (!result.authenticate(authBody.password)) {
                    return res.status(401).send({
                        message: 'UserName or Password does not match'
                    });

                }
                if (result.group.code !== 'superadmin' && req.app.locals.backendsettings[result.company_id].expire_date.getTime() < Date.now()) {
                    res.status(402).send({ message: 'Company disabled due to payment' });
                    return;
                }
                var group = {};
                if (result.group) {
                    group = result.group.code;
                } else {
                    group = "guest"; // Defaulting to GUEST group
                }
                    var token = jwt.sign(
                    {
                        id: result.id,
                        company_id: result.company_id,
                        iss: jwtIssuer,
                        sub: result.username,
                        username: result.username,
                        uid: result.id,
                        role: group
                    }, jwtSecret, {
                        expiresIn: "4h"
                    });

                req.token = jwt.verify(token, jwtSecret);

                if (req.token.role !== 'superadmin') {
                    db.users.findAll({
                        include : [{model : db.groups, attributes: ['code'], where : {code : 'admin'}}],
                        where: {company_id: req.token.company_id, isavailable: true}
                    }).then(function (data) {
                        for (var i = 0; i < data.length; i++) {
                            const userData = {
                                email: data[i].email

                            };

                            const smtpConfig = {
                                host: (req.app.locals.backendsettings[req.token.company_id].smtp_host) ? req.app.locals.backendsettings[req.token.company_id].smtp_host.split(':')[0] : 'smtp.gmail.com',
                                port: (req.app.locals.backendsettings[req.token.company_id].smtp_host) ? Number(req.app.locals.backendsettings[req.token.company_id].smtp_host.split(':')[req.token.company_id]) : 465,
                                secure: (req.app.locals.backendsettings[req.token.company_id].smtp_secure === false) ? req.app.locals.backendsettings[req.token.company_id].smtp_secure : true,
                                auth: {
                                    user: req.app.locals.backendsettings[req.token.company_id].email_username,
                                    pass: req.app.locals.backendsettings[req.token.company_id].email_password
                                }
                            };

                            // var ip = req.ip.replace('::ffff:', '');

                            const htmlBody = `User: ${req.body.username} has logged in. <br> Browser Info: ${req.headers['user-agent']} <br> Time: ${new Date().toISOString()}  <br> City: ${req.geoip.city} <br> Country: ${req.geoip.country} <br> IP Address: ${ip}`;
                            const mailOptions = {
                                to: userData.email,
                                from: req.app.locals.backendsettings[req.token.company_id].email_address,
                                subject: 'Someone just logged in!',
                                html: htmlBody
                            };


                            sendEmail(smtpConfig, mailOptions, ({status, message, error}) => {
                                if (error) {
                                    // res.send({status, message});
                                } else {
                                    //res.send({status, message});
                                }
                            });
                        }
                        ;

                    })
                }

                else {
                    console.log('User is Admin');
                }


                let ip = req.ip.replace('::ffff:', '');
                return db.users.update({last_login_ip: ip }, {where: {id: result.id}})
                    .then(function () {
                        //Wait for the user's menu object to be prepared. Once finished, return the object or the error (respectively)
                        return prepare_menu_for_role(result.group.id, result.group.code).then(function (menu_object) {
                            res.json({ token: token, menujson: menu_object }); //Preparing the menu object was successful. Return the response
                        }).catch(function (error) {
                            winston.error("Could not get menu for this user :", error);
                            res.jsonp(error); //Preparing the menu object was a failure. Return the error
                        });
                    }).catch(function(err) {
                        winston.error("Update of last login ip failed  ", err)
                        //Wait for the user's menu object to be prepared. Once finished, return the object or the error (respectively)
                        return prepare_menu_for_role(result.group.id, result.group.code).then(function(menu_object){
                            res.json({token:token, menujson:menu_object}); //Preparing the menu object was successful. Return the response
                        }).catch(function(error){
                            winston.error("Could not get menu for this user :", error);
                            res.jsonp(error); //Preparing the menu object was a failure. Return the error
                        });
                    });
            }
        }
    ).catch(function (err) {
        winston.error("Finding the user failed with error: ", err);
        res.jsonp(err);
    });
};

exports.logingmail = function (req, res) {

    let aHeader = req.get("Authorization");

    //Check if this request is signed by a valid token
    let token = null;
    if (typeof aHeader != 'undefined')
        token = aHeader;

    try {
        let decoded = jwt.verify(token, jwtSecret);
        req.token = decoded;
    } catch (err) {
        return res.status(403).json({
            message: 'User is not allowed'
        });
    }
    DBModel.findOne(
        {
            where: {
                id: req.token.id
            },
            include: [{model: db.groups, required: true}]
        }
    ).then(function (result) {
        if (!result) {
            return res.status(404).send({
                message: 'UserName does not exist'
            });
        } else {
            if (req.app.locals.backendsettings[result.company_id].expire_date.getTime() < Date.now()) {
                res.status(402).send({ message: 'Company disabled due to payment' });
                return;
            }

            let ip = req.ip.replace('::ffff:', '');
            return db.users.update({last_login_ip: ip }, {where: {id: result.id}})
            .then(function() {
                //Wait for the user's menu object to be prepared. Once finished, return the object or the error (respectively)
                return prepare_menu_for_role(result.group.id, result.group.code).then(function (menu_object) {
                    res.json({ user: result, menujson: menu_object }); //Preparing the menu object was successful. Return the response
                }).catch(function (error) {
                    winston.error("Could not get menu for this user :", error);
                    res.jsonp(error); //Preparing the menu object was a failure. Return the error
                });
            }).catch(function(err) {
                winston.error('Updating last_login_ip failed with error ', err);
                //Wait for the user's menu object to be prepared. Once finished, return the object or the error (respectively)
                return prepare_menu_for_role(result.group.id, result.group.code).then(function (menu_object) {
                    res.json({ user: result, menujson: menu_object }); //Preparing the menu object was successful. Return the response
                }).catch(function (error) {
                    winston.error("Could not get menu for this user :", error);
                    res.jsonp(error); //Preparing the menu object was a failure. Return the error
                });
            })

        }
    }).catch(function (err) {
        winston.error("Finding the user failed with error: ", err);
        res.jsonp(err);
    });

};

exports.issueJWT = function (userid, username, group, company_id) {
    let token = jwt.sign(
        {
            id: userid,
            company_id: company_id,
            iss: jwtIssuer,
            sub: username,
            username: username,
            uid: userid,
            role: group
        }, jwtSecret, {
            expiresIn: "4h"
        });

    return token;
}

exports.get_personal_details = function (req, res) {
    DBModel.findOne(
        {
            where: {
                username: req.token.sub
            },
            include: [{ model: db.groups }]
        }
    ).then(function (result) {
        res.send(result);
    }).catch(function (err) {
        winston.error("Finding user via token failed with error: ", err);
        return res.status(404).send({
            message: 'User not found'
        });
    });
};

/**
 * Update
 */
exports.update_personal_details = function (req, res) {

    DBModel.findOne({
        where: {username: req.token.sub}
    }).then(function (result) {

        if (result) {
            result.updateAttributes(req.body)
                .then(function (result) {
                    res.json(result);
                })
                .catch(function (err) {
                    winston.error("Updating the user's data failed with error: ", err);
                    return res.status(500).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
        }
        else {
            return res.status(404).send({
                message: 'User not found'
            });
        }
    });
};

/**
 * Change Password
 */
exports.changepassword1 = function (req, res, next) {
    // Init Variables
    var passwordDetails = req.body;
    var message = null;

    if (req.token) {
        if (passwordDetails.newPassword) {
            DBModel.findById(req.token.id).then(function (user) {
                if (user) {
                    if (user.company_id === req.token.company_id) {
                        if (user.authenticate(passwordDetails.currentPassword)) {
                            if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                                user.update({hashedpassword: passwordDetails.newPassword})
                                    .then(function () {
                                        res.send({
                                            message: 'Password changed successfully'
                                        });
                                    })
                                    .catch(function (error) {
                                        winston.error("Updating the user's password failed with error: ", error);
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(error)
                                        });
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
                    }
                    else {
                        res.status(404).send({message: 'User not authorized to access these data'});
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


/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {
    var smtpTransport;

    async.waterfall([
        function (done) { // Lookup user by username or email
            if (!req.body.username && !req.body.email) {
                return res.status(400).send({message: 'Username field must not be blank'});
            }
            else {
                var user_data;
                if (req.body.username) user_data = {username: req.body.username.toLowerCase()};
                else if (req.body.email) user_data = {email: req.body.email.toLowerCase()};
                DBModel.find({
                    where: user_data
                }).then(function (user) {
                    //the user was not found. Either the username or email was incorrect
                    if (!user && req.body.username) return res.status(400).send({message: 'No account with that username has been found'});
                    if (!user && req.body.email) return res.status(400).send({message: 'No account linked to this email has been found'});
                    //the user was found. Go to next step
                    else done(null, user);
                    return null;
                }).catch(function(err) {
                    winston.error("Finding the user failed with error: ", err);
                    return res.status(400).send({message: 'An error occurred while searching for this user'});
                });
            }
        },
        function(user, done){
            //initialize SMTP object
            var smtpConfig = {
                host: (req.app.locals.backendsettings[user.company_id].smtp_host) ? req.app.locals.backendsettings[user.company_id].smtp_host.split(':')[0] : 'smtp.gmail.com',
                port: (req.app.locals.backendsettings[user.company_id].smtp_host) ? Number(req.app.locals.backendsettings[user.company_id].smtp_host.split(':')[1]) : 465,
                secure: (req.app.locals.backendsettings[user.company_id].smtp_secure === false) ? req.app.locals.backendsettings[user.company_id].smtp_secure : true,
                auth: {
                    user: req.app.locals.backendsettings[user.company_id].email_username,
                    pass: req.app.locals.backendsettings[user.company_id].email_password
                }
            };
            smtpTransport = nodemailer.createTransport(smtpConfig);
            done(null, user);
        },
        function (user, done) { // Update user data
            var token = crypto.randomBytes(Math.ceil(64)).toString('hex').slice(0, 20); //generates random string of 128 characters
            user.resetpasswordtoken = token;
            user.resetpasswordexpires = Date.now() + 3600000; // token duration set to 1 hour
            //update the user. save the reset token and reset timestamp
            user.save().then(function (saved) {
                if (!saved) done(true); //an error occurred during the reset. terminate process with error
                else done(null, token, saved);
            });
        },
        function (token, saved, done) { // Prepare reset email
            res.render(path.resolve('modules/mago/server/templates/reset-password-email'), {
                name: saved.username,
                appName: config.app.title,
                url: 'http://' + req.headers.host + '/api/auth/tokenvalidate/' + token
            }, function (err, emailHTML) {
                done(err, emailHTML, saved);
            });
        },
        function (emailHTML, saved, done) { // Send reset email
            var mailOptions = {
                to: saved.email,
                from: req.app.locals.backendsettings.email_address,
                subject: 'Password Reset',
                html: emailHTML
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (!err) {
                    res.status(200).send({message: "An email has been sent to the user's email address with further instructions."});
                } else {
                    winston.error("Resetting user password failed with error: ", err);
                    return res.status(400).send({message: 'Failure sending email'});
                }
                done(err);
            });
        }
    ], function (err) {
        if (err) {
            return next(err);
        }
    });
};

exports.renderPasswordForm = function (req, res) {
    DBModel.findOne({
        attributes: ['id'],
        where: {resetpasswordtoken: req.params.token, resetpasswordexpires: {$gte: Date.now()}} //token is the identifier for this action, expired tokens are invalid identifiers
    }).then(function (found_user) {
        if (found_user) {
            res.render(path.resolve('modules/mago/server/templates/reset-password-enter-password'), {token: req.params.token}, function (err, html) {
                res.send(html);
            });
            return null;
        }
        else {
            res.send({message: "The link to reset your password is not valid. Please re-make the request for a reset link"});
        }
    }).catch(function(error){
        winston.error("Cannot find password form, error: ", error);
        res.send({message: "Unable to redirect to the reset password page. Please contact your administrator for further instructions."});
    });

};

exports.resetPassword = function (req, res) {

    DBModel.findOne({
        attributes: ['id', 'invite_pending'], where: { resetpasswordtoken: req.params.token, resetpasswordexpires: { $gte: Date.now() } } //token is the identifier for this action, expired tokens are invalid identifiers
    }).then(function (found_user) {
        if (!found_user || !found_user.id) {
            res.send({ message: "The link to reset your password is not valid. Please re-make the request for a reset link" });
        }
        else {
            let updateObj = { hashedpassword: req.body.password, resetpasswordexpires: 0 };

            if (found_user.invite_pending == true) {
                updateObj.invite_pending = false;
            }

            found_user.update(
                updateObj, //set value to 0. Indicates that the password was reset and the link should no longer work
            ).then(function (user_updated) {
                if (user_updated) res.redirect('/admin');
                else res.send({ message: "Unable to redirect to the reset password page. Please contact your administrator for further instructions." });
            }).catch(function (error) {
                winston.error("Resetting the user's password failed with error: ", error);
                res.send({ message: "An error occurred while trying to reset your password. Please contact your administrator for further instructions." });
            });
            return null;
        }
    }).catch(function (error) {
        winston.error("Resetting the user's password failed with error: ", error);
        res.send({ message: "Unable to redirect to the reset password page. Please contact your administrator for further instructions." });
    });
}

function prepare_menu_for_role(role_id, role_name) {

    return new Promise(function (success, failure) {
        var complete_menu_object = require(path.resolve("./config/defaultvalues/menu_map.json")); //This object contains the complete list of menu's, in a hierarchic order.
        var custom_menu_object = []; //the user's menu will be placed here
        var user_group_id = role_id;
        var allowed_menu_id_list = [];

        if (role_name == 'admin') {
            //Iterate through each label, it's menu's and their sub-menus to prepare the Menu for this user
            async.forEach(complete_menu_object, function (label, callback) {
                var label_added = false; //this flag helps verify whether the label for this group of menu's has been added in the custom menu object

                //Iterate through each list of menu's for the current label. Add only labels that contain at least one valid menu for the user. Add only menu's for which the user has permission
                async.forEach(label.menu_list, function (menu_level_one, callback) {

                    //Avoid adding empty menu objects
                    if (menu_level_one === undefined) {
                        callback(null);
                    }
                    else {
                        //Verify if the label for this group of menu's has been added. If no, add it and set the flag to true
                        if (label_added === false) {
                            var temp_label_object = {
                                "template": label.template,
                                "group_roles": [role_name],
                                "children": []
                            };
                            custom_menu_object.push(temp_label_object);
                            label_added = true; //the label for this list of menu's was added. Set flag to true, to avoid repeating this label
                        }
                        ;
                        //Prepare the a temporary object for current menu. Iterate through the children property to add the group role for each child (sub-menu)
                        var temp_menu_level_one_object = {
                            "title": menu_level_one.description,
                            "icon": menu_level_one.icon,
                            "group_roles": [role_name],
                            "children": menu_level_one.children
                        };
                        if (menu_level_one.link) temp_menu_level_one_object.link = menu_level_one.link; //Menu is clickable. Add link
                        async.forEach(temp_menu_level_one_object.children, function (menu_level_two, callback) {
                            menu_level_two.group_roles = [role_name];
                            callback(null);
                        }, function (error) {
                            if (!error) {
                                custom_menu_object.push(temp_menu_level_one_object); //The group role was successfully added into each sub-menu. Add this menu object into the custom_menu_object
                                callback(null); //Go to next menu
                            }
                            else {
                                winston.error("The group role could not be added into each sub-menu at authentication, error: ",error);
                                callback(error); //The group role could not be added into each sub-menu. Return error
                            }
                        });
                    }
                }, function (error) {
                    if (!error) {
                        callback(null); //The current label, menus and children were added in custom_menu_object
                    }
                    else {
                        winston.error("The current label, menus and children could not be added in custom_menu_object at authentication, error: ",error);
                        callback(error); //The current label, menus and children could not be added in custom_menu_object. Return the error
                    }

                });
            }, function (error) {
                if (!error) return success(custom_menu_object); //The complete menu object was iterated and the user's menu was prepared successfully. Return it to the controller
                else {
                    winston.error("Preparing the user's menu failed at authentication, error: ",error);
                    return failure(error); // Preparing the user's menu failed. Return the error
                }
            });
            return;
        }

        //Find the group rights
        db.grouprights.findAll({
            attributes: ['api_group_id'], where: {group_id: user_group_id, allow: true}, logging: winston.info
        }).then(function (api_group_list) {
            if ((!api_group_list) && (api_group_list.length < 1)) {
                return failure("This user does not have permission over any menu currently"); //The user's permission list is empty. Return a warning
            }
            else {

                //Add the id's of the menu's for which the user has permission into the array allowed_menu_id_list
                for (var i = 0; i < api_group_list.length; i++) allowed_menu_id_list.push(api_group_list[i].api_group_id);

                //Iterate through each label, it's menu's and their sub-menus to prepare the Menu for this user
                async.forEach(complete_menu_object, function (label, callback) {
                    var label_added = false; //this flag helps verify whether the label for this group of menu's has been added in the custom menu object

                    //Iterate through each list of menu's for the current label. Add only labels that contain at least one valid menu for the user. Add only menu's for which the user has permission
                    async.forEach(label.menu_list, function (menu_level_one, callback) {

                        //Avoid adding empty menu objects
                        if (menu_level_one === undefined) {
                            callback(null);
                        }
                        //Only consider menu's for which the user has permission
                        else if (allowed_menu_id_list.indexOf(menu_level_one.id) !== -1) {

                            //Verify if the label for this group of menu's has been added. If no, add it and set the flag to true
                            if (label_added === false) {
                                var temp_label_object = {
                                    "template": label.template,
                                    "group_roles": [role_name],
                                    "children": []
                                };
                                custom_menu_object.push(temp_label_object);
                                label_added = true; //the label for this list of menu's was added. Set flag to true, to avoid repeating this label
                            }
                            ;
                            //Prepare the a temporary object for current menu. Iterate through the children property to add the group role for each child (sub-menu)
                            var temp_menu_level_one_object = {
                                "title": menu_level_one.description,
                                "icon": menu_level_one.icon,
                                "group_roles": [role_name],
                                "children": menu_level_one.children
                            };
                            if (menu_level_one.link) temp_menu_level_one_object.link = menu_level_one.link; //Menu is clickable. Add link
                            async.forEach(temp_menu_level_one_object.children, function (menu_level_two, callback) {
                                menu_level_two.group_roles = [role_name];
                                callback(null);
                            }, function (error) {
                                if (!error) {
                                    custom_menu_object.push(temp_menu_level_one_object); //The group role was successfully added into each sub-menu. Add this menu object into the custom_menu_object
                                    callback(null); //Go to next menu
                                }
                                else {
                                    winston.error("The group role could not be added into each sub-menu at authentication, error: ",error);
                                    callback(error); //The group role could not be added into each sub-menu. Return error
                                }
                            });

                        }
                        else {
                            callback(null); //the user does not have permission to view
                        }
                    }, function (error) {
                        if (!error) {
                            callback(null); //The current label, menus and children were added in custom_menu_object
                        }
                        else {
                            winston.error("The current label, menus and children could not be added in custom_menu_object at authentication, error: ",error);
                            callback(error); //The current label, menus and children could not be added in custom_menu_object. Return the error
                        }

                    });
                }, function (error) {
                    if (!error) return success(custom_menu_object); //The complete menu object was iterated and the user's menu was prepared successfully. Return it to the controller
                    else {
                        winston.error("Preparing the user's menu failed at authentication, error: ",error);
                        return failure(error); // Preparing the user's menu failed. Return the error
                    }
                });
            }

        }).catch(function (error) {
            winston.error("The user's permissions could not be verified, therefore preparing the user's menu failed at authentication, error: ",error);
            return failure(error); // The user's permissions could not be verified, therefore preparing the user's menu failed. Return the error
        });
    });
}



