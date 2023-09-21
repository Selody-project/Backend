const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const { sequelize } = require('../models/index');
const {
  isMine,
  isLike,
  getAccessLevel,
} = require('../utils/accessLevel');

// Model
const Group = require('../models/group');
const Post = require('../models/post');
const PostDetail = require('../models/postDetail');
const Comment = require('../models/comment');
const Like = require('../models/like');

// Error
const {
  DataFormatError, ApiError,
  GroupNotFoundError, PostNotFoundError, CommentNotFoundError,
  EditPermissionError, DuplicateLikeError,
} = require('../errors');

// Validator
const {
  validateGroupIdSchema,
  validatePostSchema, validatePostIdSchema, validatePageSchema,
  validateCommentSchema, validateCommentIdSchema,
} = require('../utils/validators');

async function postGroupPost(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      return next(new EditPermissionError());
    }

    const { title, content } = req.body;
    const post = await Post.create({ author: req.nickname, title });
    await post.createPostDetail({ content });

    await user.addPosts(post);
    await group.addPosts(post);

    return res.status(201).json({ message: 'Successfully created the post.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getSinglePost(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    const { title, author } = post;
    const { content } = (await post.getPostDetail()).dataValues;

    const accessLevel = await getAccessLevel(user, group);
    const isMineValue = isMine(user, post);
    const { likesCount, isLikedValue } = (await isLike(user, post));
    return res.status(200).json({
      accessLevel,
      post: {
        postId: post.postId,
        isMine: isMineValue,
        isLiked: isLikedValue,
        likesCount,
        author,
        title,
        content,
      },
    });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupPosts(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validatePageSchema(req.query);

    if (paramError || queryError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    const { page } = req.query;
    const pageSize = 7;

    const startIndex = (page - 1) * pageSize;
    const { rows } = await Post.findAndCountAll({
      where: {
        groupId,
      },
      include: [
        {
          model: PostDetail,
          as: 'postDetail',
        },
      ],
      offset: startIndex,
      limit: pageSize,
    });

    const feed = await Promise.all(
      rows.map(async (post) => {
        const isMineValue = isMine(user, post);
        const { likesCount, isLikedValue } = (await isLike(user, post));
        return {
          postId: post.postId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          content: post.postDetail.content,
        };
      }),
    );
    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, feed });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putGroupPost(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (!isMine(user, post)) {
      return next(new EditPermissionError());
    }

    const { title, content } = req.body;
    await post.update({ title });
    await PostDetail.update({ content }, { where: { postId } });

    return res.status(200).json({ message: 'Successfully modified the post.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupPost(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, post))) {
      return next(new EditPermissionError());
    }

    await post.destroy();

    return res.status(204).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupPostLike(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId, { transaction }),
      Post.findByPk(postId, { transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    const existingLike = await Like.findOne({
      where: {
        userId: user.userId,
        postId: post.postId,
      },
      transaction,
    });

    if (existingLike) {
      throw (new DuplicateLikeError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const like = await Like.create({}, { transaction });
    await user.addLike(like, { transaction });
    await post.addLikes(like, { transaction });

    await transaction.commit();
    return res.status(201).json({ message: 'Successfully created a Like.' });
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteGroupPostLike(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      throw new DataFormatError();
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId, { transaction }),
      Post.findByPk(postId, { transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      throw new EditPermissionError();
    }

    const like = await Like.findOne({
      where: {
        userId: user.userId,
        postId: post.postId,
      },
      transaction,
    });
    if (!like) {
      throw (new DuplicateLikeError());
    }
    await like.destroy({ transaction });

    await transaction.commit();

    return res.status(204).end();
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function postComment(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      return next(new EditPermissionError());
    }

    const { content } = req.body;
    const comment = await post.createComment({ content });
    await user.addComments(comment);

    return res.status(201).json({ message: 'Successfully created the comment.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getSingleComment(req, res, next) {
  try {
    const { error: paramError } = validateCommentIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
      Comment.findByPk(commentId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (!comment) {
      return next(new CommentNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    comment.dataValues.isMine = isMine(user, comment);

    return res.status(200).json({ accessLevel, comment });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getPostComment(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    const comments = (await post.getComments()).map((comment) => ({
      commentId: comment.commentId,
      content: comment.content,
      depth: comment.depth,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      userId: comment.userId,
      isMine: isMine(user, comment),
    }));

    return res.status(200).json({ accessLevel, comments });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putComment(req, res, next) {
  try {
    const { error: paramError } = validateCommentIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
      Comment.findByPk(commentId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (!comment) {
      return next(new CommentNotFoundError());
    }

    if (!isMine(user, comment)) {
      return next(new EditPermissionError());
    }

    const { content } = req.body;
    await comment.update({ content });

    return res.status(200).json({ message: 'Successfully modified the comment.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteComment(req, res, next) {
  try {
    const { error: paramError } = validateCommentIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findByPk(postId),
      Comment.findByPk(commentId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (!comment) {
      return next(new CommentNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, comment))) {
      return next(new EditPermissionError());
    }

    await comment.destroy();

    return res.status(204).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserFeed(req, res, next) {
  try {
    const { error: queryError } = validatePageSchema(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const { user } = req;
    const groups = (await user.getGroups()).map((group) => group.groupId);

    const { page } = req.query;
    const pageSize = 12;

    const startIndex = (page - 1) * pageSize;
    const posts = await Post.findAll({
      where: {
        groupId: {
          [Op.in]: groups,
        },
      },
      include: [
        {
          model: PostDetail,
          as: 'postDetail',
        },
      ],
      order: [['createdAt', 'DESC']],
      offset: startIndex,
      limit: pageSize,
    });
    const feed = await Promise.all(
      posts.map(async (post) => {
        const isMineValue = isMine(user, post);
        const { likesCount, isLikedValue } = (await isLike(user, post));
        return {
          postId: post.postId,
          groupId: post.groupId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          content: post.postDetail.content,
        };
      }),
    );

    return res.status(200).json({ feed });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  postGroupPost,
  getSinglePost,
  getGroupPosts,
  putGroupPost,
  deleteGroupPost,
  postGroupPostLike,
  deleteGroupPostLike,
  postComment,
  getSingleComment,
  getPostComment,
  putComment,
  deleteComment,
  getUserFeed,
};
