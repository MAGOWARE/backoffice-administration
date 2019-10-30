'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('UPDATE users AS u INNER JOIN groups ON groups.id=u.group_id SET u.group_id=(SELECT id FROM groups WHERE company_id=-1 AND code="superadmin") WHERE u.username="superadmin" AND u.company_id=-1 AND groups.company_id!=-1;')
      .catch(function(err) {

      })
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  }
};
