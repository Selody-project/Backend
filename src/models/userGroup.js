const Sequelize = require('sequelize');
const User = require('./user');
const Group = require('./group');

class UserGroup extends Sequelize.Model {
  static initiate(sequelize) {
    UserGroup.init({
    }, {
      sequelize,
      modelName: 'UserGroup',
      tableName: 'UserGroup',
      timestamps: false,
    });
  }

  static associate(db) {
    User.belongsToMany(db.Group, { through: 'UserGroup', foreignKey: 'userId', timestamps: false });
    Group.belongsToMany(db.User, { through: 'UserGroup', foreignKey: 'groupId', timestamps: false });
  }
}

module.exports = UserGroup;
