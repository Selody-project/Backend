const Sequelize = require('sequelize');

class Like extends Sequelize.Model {
  static initiate(sequelize) {
    Like.init({ }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Like',
      tableName: 'like',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Like.belongsTo(db.User, {
      foreignKey: 'userId',
    });
    db.Like.belongsTo(db.Post, {
      foreignKey: 'postId',
    });
  }
}

module.exports = Like;
