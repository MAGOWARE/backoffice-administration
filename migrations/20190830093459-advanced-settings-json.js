'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(function (t) {
      return Promise.all([
        queryInterface.removeColumn('advanced_settings', 'parameter_value', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.removeColumn('advanced_settings', 'parameter1_value', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.removeColumn('advanced_settings', 'parameter2_value', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.removeColumn('advanced_settings', 'parameter3_value', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.removeColumn('advanced_settings', 'duration', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.removeColumn('advanced_settings', 'description', { transaction: t })
          .catch(function (err) {
            winston.error(err)
          }),
        queryInterface.addColumn('advanced_settings', 'data', {
          type: Sequelize.TEXT,
          allowNull: true
        }, { transaction: t }).catch(function (err) {
          winston.error(err);
        })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(function (t) {
      return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=0', { transaction: t })
        .then(function () {
          return Promise.all([
            queryInterface.removeColumn('advanced_settings', 'data', { transaction: t })
              .catch(function (err) {
                winston.error(err);
              }),
            queryInterface.addColumn('advanced_settings', 'parameter_value', {
              type: Sequelize.STRING(100),
              allowNull: false
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
            queryInterface.addColumn('advanced_settings', 'parameter1_value', {
              type: Sequelize.STRING(100),
              allowNull: true
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
            queryInterface.addColumn('advanced_settings', 'parameter2_value', {
              type: Sequelize.STRING(100),
              allowNull: true
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
            queryInterface.addColumn('advanced_settings', 'parameter3_value', {
              type: Sequelize.STRING(100),
              allowNull: true
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
            queryInterface.addColumn('advanced_settings', 'duration', {
              type: Sequelize.INTEGER(50),
              allowNull: true
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
            queryInterface.addColumn('advanced_settings', 'description', {
              type: Sequelize.STRING(500),
              allowNull: true
            }, { transaction: t }).catch(function (err) {
              winston.error(err);
            }),
          ]);
        });
    });
  }
};
