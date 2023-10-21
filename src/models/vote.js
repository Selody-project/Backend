const Sequelize = require('sequelize');

class Vote extends Sequelize.Model {
  static initiate(sequelize) {
    Vote.init({
      voteId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startDateTime: {
        type: Sequelize.DATE(3),
        allowNull: false,
      },
      endDateTime: {
        type: Sequelize.DATE(3),
        allowNull: false,
      },
      recurrence: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
      },
      freq: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      byweekday: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      until: {
        type: Sequelize.DATE(3),
        allowNull: true,
      },
      votingEndDate: {
        type: Sequelize.DATE(3),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Vote',
      tableName: 'votes',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Vote.belongsTo(db.Group, {
      foreignKey: 'groupId',
    });
    db.Vote.hasMany(db.VoteResult, {
      foreignKey: 'voteId',
      onDelete: 'cascade',
    });
  }
}

module.exports = Vote;
