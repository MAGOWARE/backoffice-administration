'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  express = require('./express'),
  chalk = require('chalk'),
  sequelize = require('./sequelize-connect'),
  winston = require('./winston'),
  redis = require('./redis'),
  autoDeleteFiles = require('../../custom_functions/autoDeleteFiles');


module.exports.init = function init(callback) {
  var app;
  if (process.env.NODE_APP_INSTANCE == 0) {
    //start server redis immediately
    redis.startServer(function(err) {
      if (err) {
        winston.error("Error starting redis server",err);
        process.exit(1);
      }

      if (process.send) {
        process.send('ready');
      }
      
      redis.createClient();
      app = express.init(sequelize, redis.client);
      if (callback) callback(app, sequelize, config);    
    })
  }
  else {
    process.send('ready')
    redis.createClient();
    app = express.init(sequelize, redis.client);
    if (callback) callback(app, sequelize, config);    
  }
};

module.exports.start = function start(callback) {
  winston.info('Initializing Stack...');

  var _this = this;

  _this.init(function(app, db, config) {

    // Start the app by listening on <port>
    app.listen(config.port, function() {
      // Logging initialization
      console.log('--------------------------');
      console.log(chalk.green(config.app.title));
      console.log(chalk.green('Environment:\t\t') + process.env.NODE_ENV);
      console.log(chalk.green('Port:\t\t\t') + config.port);
      console.log(chalk.green('Database:\t\t') + config.db.database);
      if (config.secure && config.secure.ssl === true) {
        console.log(chalk.green('SSL:\t\t\tON'));
      }
      console.info(chalk.green('App version:\t\t') + config.seanjs.version+" "+config.seanjs.db_migration_nr);

      if (config.seanjs['seanjs-version']) {
        console.log(chalk.green('SEAN.JS version:\t') + config.seanjs['seanjs-version']);
      }

      console.info(chalk.green('App URL:\t\t') + (process.env.NODE_HOST || 'localhost') + ":" + config.port);

      if (!config.app.reCaptchaSecret) {
        winston.warn('Missing reCaptcha Secret in env!');
      }

      if (callback) callback(app, db, config);
    }).on('error', function(error){
      if(error.code === 'EADDRINUSE')
        console.log('Port '+config.port+' is already in use. \nPlease make sure this port is available, or change the configurations in ./config/env/default.js to use a free port.');
      else if(error.code === 'EACCES')
        console.log('You are attempting to connect to port '+config.port+' without root privilege. \nPlease make sure you have permission to use this port, or change the configurations in ./config/env/default.js to an available port above 1023.');
      else
        console.log('Failed to start the app with error: '+error.code+'\nPlease refer to Node Js documentation for this error, or contact the Magoware support team.');
      process.exit(1);
    });

  });

};