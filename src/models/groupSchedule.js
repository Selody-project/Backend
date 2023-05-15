const Sequelize = require('sequelize');

class GroupSchedule extends Sequelize.Model {
  static initiate(sequelize) {
    GroupSchedule.init({
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      groupId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      repeat: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      dayMonth: {
        type: Sequelize.STRING(30),
        allowNull: true,
        defaultValue: null,
      },
      month: {
        type: Sequelize.STRING(30),
        allowNull: true,
        defaultValue: null,
      },
      dayWeek: {
        type: Sequelize.STRING(30),
        allowNull: true,
        defaultValue: null,
      },
      confirmed: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
      },
      possible: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      impossible: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      modelName: 'GroupSchedule',
      tableName: 'groupSchedule',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.GroupSchedule.belongsTo(db.Group, {
      foreignKey: 'groupId',
    });
  }
}

module.exports = GroupSchedule;
