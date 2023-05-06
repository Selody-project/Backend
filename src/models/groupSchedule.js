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
      repeatType: {
        type: Sequelize.ENUM('YEAR', 'MONTH', 'WEEK', 'DAY'),
        allowNull: true,
      },
      confirmed: {
        type: Sequelize.TINYINT,
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
