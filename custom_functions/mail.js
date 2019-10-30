'use strict'

var nodemailer = require("nodemailer");

exports.send = function(req, options) {
    return new Promise(function(resolve, reject) {
        if (!options.company_id) {
            reject({code: 400, message: 'Company id is required'});
            return;
        }

        if (!options.to) {
            reject({code: 400, message: 'Receiver is required'});
            return;
        }

        if (!options.subject) {
            reject({code: 400, message: 'Subject is required'});
            return;
        }

        if (!options.body) {
            reject({code: 400, message: 'Body is required'});
            return;
        }

        if (!options.content_type) {
            reject({code: 400, message: 'Body content type is required'});
            return;
        }

        let smtpConfig = {
            host: (req.app.locals.backendsettings[options.company_id].smtp_host) ? req.app.locals.backendsettings[options.company_id].smtp_host.split(':')[0] : 'smtp.gmail.com',
            port: (req.app.locals.backendsettings[options.company_id].smtp_host) ? Number(req.app.locals.backendsettings[options.company_id].smtp_host.split(':')[1]) : 465,
            secure: (req.app.locals.backendsettings[options.company_id].smtp_secure === false) ? req.app.locals.backendsettings[options.company_id].smtp_secure : true,
            auth: {
                user: req.app.locals.backendsettings[options.company_id].email_username,
                pass: req.app.locals.backendsettings[options.company_id].email_password
            }
        };
    
        let smtpTransport = nodemailer.createTransport(smtpConfig);

        let mailOptions = {
            to: options.to, //user.email,
            from: req.app.locals.backendsettings[options.company_id].email_address, //the from field matches the account username
            subject: options.subject
        };

        switch (options.content_type) {
            case 'html':
                mailOptions.html = options.body;
                break;
            default:
                reject({code: 400, message: "Content type not valid"});
                break;
        }

        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                reject({code: 500, message: err});
            } else {
                resolve({code: 200, message: 'Email sent'})
            }
            done(err);
        });
    })
}