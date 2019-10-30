'use strict';

var winston = require('winston')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("ALTER TABLE advanced_settings DROP FOREIGN KEY advanced_settings_company_fkey_idx;")
      .then(function () {
        return queryInterface.sequelize.query('ALTER TABLE advanced_settings DROP INDEX company_parameter_id_unique;')
          .then(function () {
            return queryInterface.sequelize.query('ALTER TABLE advanced_settings DROP parameter_id')
              .then(function () {
                return addFK()
                  .catch(function (err) { winston.error(err) });
              })
              .catch(function (err) {
                winston.error(err);
                return addFK()
                  .catch(function (err) { winston.error(err) });
              })
          }).catch(function (err) {
            winston.error(err)
            return addFK()
              .catch(function (err) { winston.error(err) });
          })
      }).catch(function (err) {
        winston.error(err)
        return addFK()
          .catch(function (err) { winston.error(err) });
      })

    function addFK() {
      return queryInterface.sequelize.query("ALTER TABLE advanced_settings ADD CONSTRAINT advanced_settings_company_fkey_idx FOREIGN KEY(company_id) REFERENCES settings(id);")
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('advanced_settings', 'parameter_id', {
      type: Sequelize.STRING(100),
      allowNull: false,
    }).then(function () {
      return queryInterface.sequelize.query('ALTER TABLE advanced_settings ADD CONSTRAINT company_parameter_id_unique UNIQUE(company_id, parameter_id)')
        .catch(function (err) {
          winston.error(err)
        });
    }).catch(function (err) {
      winston.error(err)
    })
  }
};
