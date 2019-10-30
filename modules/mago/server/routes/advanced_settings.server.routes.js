'use strict';

var path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')).models,
  policy = require('../policies/mago.server.policy'),
  advancedSettings = require(path.resolve('./modules/mago/server/controllers/advanced_settings.server.controller'));

module.exports = function (app) {
  app.route('/api/AdvancedSettings')
    .all(policy.Authenticate)
    .all(policy.isAllowed)
    .get(advancedSettings.getAdvancedSettings)
    .put(advancedSettings.update)
};