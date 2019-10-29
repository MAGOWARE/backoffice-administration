'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('vod_stream', 'stream_mode', {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: 'vodstream_mode'
      }).catch(function (err) {
        winston.error(err);
      }),
      queryInterface.addColumn('vod_stream', 'stream_type', {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: 'vodstream_type'
      }).catch(function (err) {
        winston.error(err);
      }),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('vod_stream', 'stream_mode'),
      queryInterface.removeColumn('vod_stream', 'stream_type'),
    ]).catch(function(err) {
      winston.error(err)
    })
  }
};
