const Sequelize = require('sequelize');

class VoteResult extends Sequelize.Model {
  static initiate(sequelize) {
    VoteResult.init({
      resultId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      choice: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'VoteResult',
      tableName: 'votesResults',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.VoteResult.belongsTo(db.Vote, {
      foreignKey: 'voteId',
    });
    db.VoteResult.belongsTo(db.User, {
      foreignKey: 'userId',
    });
  }
}

module.exports = VoteResult;
