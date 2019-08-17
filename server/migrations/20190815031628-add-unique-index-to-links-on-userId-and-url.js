'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('links', { // TODO: test this in the model. And maybe simplify the test of the route.
      unique: true,
      fields: ['userId', 'url']
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('links', ['userId', 'url'])
  }
};
