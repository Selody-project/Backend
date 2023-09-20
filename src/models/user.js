const Sequelize = require('sequelize');

class User extends Sequelize.Model {
  static initiate(sequelize) {
    User.init({
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nickname: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: {
        type: Sequelize.ENUM('local', 'naver', 'google'),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      profileImage: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: process.env.DEFAULT_USER_IMAGE,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.PersonalSchedule, {
      foreignKey: 'userId',
      onDelete: 'cascade',
    });
    db.User.hasMany(db.Post, {
      foreignKey: 'userId',
    });
    db.User.hasMany(db.Like, {
      foreignKey: 'userId',
      onDelete: 'cascade',
    });
    db.User.hasMany(db.Comment, {
      foreignKey: 'userId',
    });
  }
}

module.exports = User;
