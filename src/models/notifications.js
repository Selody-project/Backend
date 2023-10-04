const Sequelize = require('sequelize');

class Notification extends Sequelize.Model {
  static initiate(sequelize) {
    Notification.init({
      content: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      notificationType: {
        type: Sequelize.ENUM('user', 'group'),
        allowNull: false,
      },
      receiverId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'Notification',
      tableName: 'notifications',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
  }
}

module.exports = Notification;
