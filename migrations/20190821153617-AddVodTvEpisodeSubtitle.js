'use strict';
const winston = require('winston')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return  Promise.all([
      queryInterface.addColumn('vod_subtitles', 'language', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'en'
      }).catch(function (err) {
        winston.error("Cannot add field vod_subtitles", err);
      }),
      queryInterface.addColumn('tv_episode_subtitles', 'language', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'en'
      }).catch(function (err) {
        winston.error("Cannot add field tv_episode_subtitles", err);
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('vod_subtitles', 'language').catch(function (err) {
        winston.error(err)
      }),
      queryInterface.removeColumn('tv_episode_subtitles', 'language').catch(function (err) {
        winston.error(err)
      })
    ]);
  }
};
