"use strict";

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
//var _ = require('lodash');
var config = require('../config');
var winston = require('./winston');

winston.info('Initializing Sequelize...');

var orm = require('./sequelize');

var models = [];

config.files.server.models.forEach(function(file) {
  models.push(path.resolve(file));
});

orm.discover = models;

orm.connect(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  storage: config.db.storage,
  logging: config.db.enableSequelizeLog ? winston.verbose : false,
  dialectOptions: {
    supportBigNumbers: true,
    ssl: config.db.ssl ? config.db.ssl : false
  },
  pool: {
    minConnections: 0,
    maxConnections: 5,
    maxIdleTime: 10000
  }
});