'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('subscription', 'customer_username', {
      type: Sequelize.STRING,
      allowNull: false
    }).catch(function (err) {
      winston.error('Dropping column city failed with error message: ', err.message);
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
