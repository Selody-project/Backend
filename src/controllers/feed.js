// Model
const User = require('../models/user');
const Group = require('../models/group');
const Post = require('../models/post');
const PostDetail = require('../models/postDetail');
const Comment = require('../models/comment');

// Error
const {
  DataFormatError, ApiError,
  UserNotFoundError, GroupNotFoundError, PostNotFoundError, CommentNotFoundError,
  EditPermissionError,
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
    const [group, user] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!user) {
      return next(new UserNotFoundError());
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

    return res.status(200).json({ author, title, content });
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

    const result = rows.map((post) => ({
      title: post.title,
      author: post.author,
      createdAt: post.createdAt,
      content: post.postDetail.content,
    }));

    return res.status(200).json(result);
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
    const [group, user, post] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (user.userId !== post.userId) {
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
    const [group, user, post] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (user.userId !== post.userId) {
      return next(new EditPermissionError());
    }

    await post.destroy();

    return res.status(204).end();
  } catch (err) {
    return next(new ApiError());
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
    const [group, user, post] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
      Post.findByPk(postId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
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

    return res.status(200).json(comment);
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

    const comments = await post.getComments();

    return res.status(200).json(comments);
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
    const [group, user, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
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

    if (user.userId !== comment.userId) {
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
    const [group, user, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      User.findOne({ where: { nickname: req.nickname } }),
      Post.findByPk(postId),
      Comment.findByPk(commentId),
    ]);

    if (!group) {
      return next(new GroupNotFoundError());
    }

    if (!user) {
      return next(new UserNotFoundError());
    }

    if (!post) {
      return next(new PostNotFoundError());
    }

    if (!comment) {
      return next(new CommentNotFoundError());
    }

    if (user.userId !== comment.userId) {
      return next(new EditPermissionError());
    }
    await comment.destroy();

    return res.status(204).end();
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
  postComment,
  getSingleComment,
  getPostComment,
  putComment,
  deleteComment,
};
