'use strict'

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    nodemailer =require('nodemailer'),
    winston = require('winston'),
    crypto = require('crypto');
    
exports.sendInvite = function(req, user, useRootMail) {
    return new Promise(function(resolve, reject) {
        let token = crypto.randomBytes(Math.ceil(64)).toString('hex').slice(0,20); //generates random string of 128 characters
        user.resetpasswordtoken = token;
        user.resetpasswordexpires = Date.now() + 3600000; 
        user.save().then(function() {
            let mailSettings = !useRootMail ? user.company_id : -1

            var smtpConfig = {
                host: (req.app.locals.backendsettings[mailSettings].smtp_host) ? req.app.locals.backendsettings[mailSettings].smtp_host.split(':')[0] : 'smtp.gmail.com',
                port: (req.app.locals.backendsettings[mailSettings].smtp_host) ? Number(req.app.locals.backendsettings[mailSettings].smtp_host.split(':')[1]) : 465,
                secure: (req.app.locals.backendsettings[mailSettings].smtp_secure === false) ? req.app.locals.backendsettings[mailSettings].smtp_secure : true,
                auth: {
                    user: req.app.locals.backendsettings[mailSettings].email_username,
                    pass: req.app.locals.backendsettings[mailSettings].email_password
                }
            }
            let link = 'http://' + req.headers.host + '/api/auth/tokenvalidate/' + token;
            var smtpTransport = nodemailer.createTransport(smtpConfig);
            db.email_templates.findOne({
                attibutes: ['content'],
                where: {template_id: 'user-invite-email'}
            }).then(function(template) {
                let htmlTemplate = null;
                if (!template) {
                    //nedd to have invite default template
                    htmlTemplate = 'email: ' + user.email + '</br> confirmation link:  ' + link;
                } else {
                    const htmlContent = template.content;
                    htmlTemplate = htmlContent.replace('{{email}}', user.email).replace('{{link}}', link).replace(/{{appName}}/g, req.app.locals.backendsettings[user.company_id].company_name).replace('{{url}}', link);
                }
    
                let mailOptions = {
                    to: user.email,
                    from: req.app.locals.backendsettings[user.company_id].email_address,
                    subject: 'Invitation',
                    html: htmlTemplate
                }
                smtpTransport.sendMail(mailOptions, function(err) {
                    if (err) {
                        winston.error('Error sending invitation: ', err);
                        reject(err)
                    }
                    else {
                        winston.info('User invitation sent');
                        resolve();
                    }
                });
            });
        }).catch(function(err) {
            winston.error('Update user failed with error: ', err);
            reject(err);
        })
    })
}