const nodemailer = require('nodemailer'),
      winston = require('winston');

module.exports = function (smtpConfig, mailOptions, callback) {
    var smtpTransport = nodemailer.createTransport(smtpConfig);

    smtpTransport.sendMail(mailOptions, function (err) {
        if (err) {
            winston.error("Error sending email at custom functions, error: ", err);
            callback({status: false, message: 'Error sending email', error: err});
        }
        else {
            callback({status: true, message: 'Email sent successfully'});
        }
    });
};