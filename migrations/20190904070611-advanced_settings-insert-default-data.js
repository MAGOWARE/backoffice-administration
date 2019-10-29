'use strict';

var path = require('path'),
    winston = require('winston'),
    defaultData = require(path.resolve('./config/defaultvalues/advanced_settings'));

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DELETE FROM advanced_settings WHERE id > 0')
    .then(function(){
      return queryInterface.sequelize.query('SELECT id FROM settings WHERE id > 0')
      .then(function(results){
        let advancedSettings = [];
        let data = JSON.stringify(defaultData);
  
        results[0].forEach(element => {
          let companySettings = {
            id: element.id,
            company_id: element.id,
            data: data
          }
  
          advancedSettings.push(companySettings);
        });
  
        return queryInterface.bulkInsert('advanced_settings', advancedSettings)
          .catch(function(err) {
            winston.error(err)
          });
      });
    })
  },

  down: (queryInterface, Sequelize) => {
    /*
      We canno restore old settings
    */
   return Promise.resolve();
  }
};
