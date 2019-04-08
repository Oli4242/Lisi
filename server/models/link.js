'use strict'
module.exports = (sequelize, DataTypes) => {
  const Link = sequelize.define('Link', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isUrl: true,
        len: [0, 2048]
      }
    },
    note: {
      type: DataTypes.STRING,
      validate: { len: [0, 512] }
    },
    title: {
      type: DataTypes.STRING,
      validate: { len: [0, 128] }
    }
  }, {})
  Link.associate = function(models) {
    Link.belongsTo(models.User, { as: 'owner', foreignKey: 'userId' })
  }
  return Link
}
