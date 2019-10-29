'use strict';

    var winston = require('winston');

    module.exports = {
      up: (queryInterface, Sequelize) => {
        return Promise.all([
              queryInterface.addColumn('salesreport', 'value', {
                    type: Sequelize.DOUBLE,
                allowNull: false,
                unique: 'value'
          }).catch(function (err) {
                winston.error(err);
              }),
              queryInterface.addColumn('salesreport', 'duration', {
                    type: Sequelize.INTEGER(20),
                allowNull: false,
                unique: 'duration'
          }).catch(function (err) {
                winston.error(err);
              }),
            ])
      },

            down: (queryInterface, Sequelize) => {
        return Promise.all([
                  queryInterface.removeColumn('salesreport', 'value'),
                  queryInterface.removeColumn('salesreport', 'duration'),
               ]).catch(function(err) {
                  winston.error(err)
                })
          }
};


