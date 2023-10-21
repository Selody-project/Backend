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
        validate: {
          len: [2, 20],
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      isPublicGroup: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: false,
      },
      image: {
        type: Sequelize.TEXT,
        defaultValue: process.env.DEFAULT_GROUP_IMAGE,
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
    });
    db.Group.hasMany(db.Post, {
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
    db.Group.hasMany(db.UserGroup, {
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
    db.Group.hasMany(db.Vote, {
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
  }
}

module.exports = Group;
