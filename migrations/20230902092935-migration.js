'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('UserGroup', 'accessLevel', {
      type: Sequelize.ENUM('viewer', 'regular', 'admin', 'owner'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('UserGroups', 'accessLevel');
  }
};
