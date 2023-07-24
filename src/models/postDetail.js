const Sequelize = require('sequelize');

class PostDetail extends Sequelize.Model {
  static initiate(sequelize) {
    PostDetail.init({
      postDetailId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'PostDetail',
      tableName: 'PostDetails',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.PostDetail.belongsTo(db.Post, {
      foreignKey: 'postId',
    });
  }
}

module.exports = PostDetail;
