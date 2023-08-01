const Sequelize = require('sequelize');

class Comment extends Sequelize.Model {
  static initiate(sequelize) {
    Comment.init({
      commentId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      depth: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'Comment',
      tableName: 'Comments',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Comment.belongsTo(db.Post, {
      foreignKey: 'postId',
    });
  }
}

module.exports = Comment;
