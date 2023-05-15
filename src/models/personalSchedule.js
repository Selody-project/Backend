const Sequelize = require('sequelize');

class PersonalSchedule extends Sequelize.Model {
  static initiate(sequelize) {
    PersonalSchedule.init({
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
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
        type: Sequelize.TINYINT(1),
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
    }, {
      sequelize,
      timestamps: false,
      inderscpred: false,
      modelName: 'PersonalSchedule',
      tableName: 'personalSchedule',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.PersonalSchedule.belongsTo(db.User, {
      foreignKey: 'userId',
    });
  }
}

module.exports = PersonalSchedule;
