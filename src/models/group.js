const Sequelize = require('sequelize');

class Group extends Sequelize.Model {
  static initiate(sequelize) {
    Group.init({
      groupId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      member: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leader: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      inviteCode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      inviteExp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      modelName: 'Group',
      tableName: 'groups',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Group.hasMany(db.GroupSchedule, {
      foreignKey: 'groupId',
      onDelete: 'cascade',
      allowNull: false,
    });
  }
}

module.exports = Group;
