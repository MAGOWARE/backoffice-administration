'use strict';
/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  authpolicy = require(path.resolve('./modules/deviceapiv2/server/auth/apiv2.server.auth.js')),
  eventlogsController = require(path.resolve('./modules/analytics/server/controllers/eventlogs.server.controller')),
  winston = require(path.resolve('./config/lib/winston'));

module.exports = function (app) {

  app.use('/apiv2', function (req, res, next) {
    winston.info(req.originalUrl + '  ' + JSON.stringify(req.body));
    //res.header("Access-Control-Allow-Origin", "*");
    next();
  });


  //event logs
  app.route('/apiv2/events/event')
    .all(authpolicy.isAuthTokenValid)
    .post(eventlogsController.event);

  app.route('/apiv2/events/screen')
    .all(authpolicy.isAuthTokenValid)
    .post(eventlogsController.screen);

  app.route('/apiv2/events/timing')
    .all(authpolicy.isAuthTokenValid)
    .post(eventlogsController.timing);

};
