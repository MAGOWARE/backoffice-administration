'use strict';

var winston = require("winston");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("DELETE logs FROM logs INNER JOIN users ON logs.user_id = users.id INNER JOIN groups ON users.group_id=groups.id WHERE groups.code='superadmin'")
      .then(function () {
        return queryInterface.sequelize.query("DELETE FROM users WHERE username='superadmin'")
          .then(function () {
            return queryInterface.sequelize.query("DELETE FROM groups WHERE code='superadmin'")
          })
          .catch(function (error) {
            winston.error(error)
          })
      }).catch(function (error) {
        winston.error(error)
      })
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    return Promise.resolve();
  }
};
