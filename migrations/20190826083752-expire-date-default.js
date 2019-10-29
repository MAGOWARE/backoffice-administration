'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("ALTER TABLE settings MODIFY COLUMN expire_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  }
};
