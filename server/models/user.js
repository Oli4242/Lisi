'use strict'
const { randomBytes } = require('crypto')
const bcrypt = require('bcrypt')
const { security } = require('../settings')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [3, 32] }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [8, Infinity] }
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [64, 128] } // TODO: isBase64: true ?
    }
  }, {
    hooks: {
      beforeValidate: (user, options) => { // TODO: test this hook when secret is null/undefined
        if (!user.secret) {
          user.secret = randomBytes(88).toString('base64') // TODO: test secret uniqueness
        }
      },
      afterValidate: async (user, options) => {
        if (user.changed('password')) { // TODO: avoid to rehash the password when validating multiple times
          user.password = await bcrypt.hash(user.password, security.bcryptCost)
        }
      }
    }
  })
  User.associate = function(models) {
    User.hasMany(models.Link, { as: 'links', foreignKey: 'userId' })
  }
  return User
}
