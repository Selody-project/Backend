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
      author: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'Post',
      tableName: 'posts',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Post.hasMany(db.Comment, {
      foreignKey: 'postId',
      onDelete: 'cascade',
    });
    db.Post.hasMany(db.Like, {
      foreignKey: 'postId',
      onDelete: 'cascade',
    });
    db.Post.belongsTo(db.User, {
      foreignKey: 'userId',
    });
  }

  static async getUserPostCount(userId) {
    try {
      const count = await Post.count({
        where: {
          userId,
        },
      });
      return count;
    } catch (err) {
      throw new Error();
    }
  }
}

module.exports = Post;
