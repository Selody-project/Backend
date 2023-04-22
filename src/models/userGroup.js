const Sequelize = require('sequelize');

class UserGroup extends Sequelize.Model {
  static initiate(sequelize) {
    UserGroup.init({
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      groupId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      sequelize,
      underscored: false,
      timestamps: false,
      modelName: 'UserGroup',
      tableName: 'userGroups',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

//  static associate(db) {}
}

module.exports = UserGroup;
