const Sequelize = require('sequelize');
const User = require('./user');
const Group = require('./group');

class UserGroup extends Sequelize.Model {
  static initiate(sequelize) {
    UserGroup.init({
      sharePersonalEvent: {
        type: Sequelize.TINYINT(1),
        allowNull: true,
        defaultValue: 1,
      },
      isPendingMember: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'UserGroup',
      tableName: 'UserGroup',
      timestamps: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    User.belongsToMany(db.Group, { through: 'UserGroup', foreignKey: 'userId', timestamps: false });
    Group.belongsToMany(db.User, { through: 'UserGroup', foreignKey: 'groupId', timestamps: false });
  }
}

module.exports = UserGroup;
