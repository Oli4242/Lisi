'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('links', {
      unique: true,
      fields: ['userId', 'url']
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('links', ['userId', 'url'])
  }
};
