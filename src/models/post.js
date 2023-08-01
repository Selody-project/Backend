const Sequelize = require('sequelize');

class Post extends Sequelize.Model {
  static initiate(sequelize) {
    Post.init({
      postId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'Post',
      tableName: 'Posts',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Post.hasMany(db.Comment, {
      foreignKey: 'postId',
      onDelete: 'cascade',
    });
    db.Post.hasOne(db.PostDetail, {
      foreignKey: 'postId',
      onDelete: 'cascade',
    });
  }
}

module.exports = Post;
