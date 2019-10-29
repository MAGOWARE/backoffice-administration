'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('ALTER TABLE vod_menu_carousel DROP FOREIGN KEY vod_menu_carousel_ibfk_1;')
      .catch(function(err) {
        winston.error(err);
      })
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve()
  }
};
