'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('settings', 'vast_ad_url', {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: 'vast_ad_url'
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('settings', 'vast_ad_format', {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: 'vast_ad_format'
            }).catch(function (err) {
                winston.error(err);
            }),
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('settings', 'vast_ad_url'),
            queryInterface.removeColumn('settings', 'vast_ad_format'),
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};
