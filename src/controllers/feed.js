const { Sequelize } = require('sequelize');

const { Op } = Sequelize;
const { deleteBucketImage } = require('../middleware/s3');
const { sequelize } = require('../models/index');
const {
  isMine,
  isLike,
  getAccessLevel,
} = require('../utils/accessLevel');

// Model
const Group = require('../models/group');
const Post = require('../models/post');
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
  validatePostSchema, validatePostIdSchema,
  validateCommentSchema, validateCommentIdSchema, validateLastRecordIdSchema,
} = require('../utils/validators');

async function postGroupPost(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const { content } = req.body;

    let post;
    if (req.fileUrl !== null) {
      const fileUrl = req.fileUrl.join(', ');
      post = await Post.create({ author: req.nickname, content, image: fileUrl }, { transaction });
    } else {
      post = await Post.create({ author: req.nickname, content }, { transaction });
    }

    await user.addPosts(post, { transaction });
    await group.addPosts(post, { transaction });

    const response = {
      ...{ message: '성공적으로 등록되었습니다.' },
      ...post.dataValues,
    };

    await transaction.commit();
    return res.status(201).json(response);
  } catch (err) {
    await deleteBucketImage(req.fileUrl);
    await transaction.rollback();
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getSinglePost(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    const isMineValue = isMine(user, post);
    const { likesCount, isLikedValue } = (await isLike(user, post));
    const commentCount = await post.countComments();
    return res.status(200).json({
      accessLevel,
      post: {
        postId: post.postId,
        isMine: isMineValue,
        isLiked: isLikedValue,
        likesCount,
        commentCount,
        author: post.author,
        content: post.content,
        image: post.image,
      },
    });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getGroupPosts(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validateLastRecordIdSchema(req.query);
    if (paramError || queryError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    let { last_record_id: lastRecordId } = req.query;
    if (lastRecordId == 0) {
      lastRecordId = Number.MAX_SAFE_INTEGER;
    }
    const { user } = req;
    const group = await Group.findByPk(groupId);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    const pageSize = 9;
    const posts = await Post.findAll({
      where: {
        groupId,
        postId: { [Sequelize.Op.lt]: lastRecordId }, // ID가 지정한 ID보다 작은(더 오래된) 레코드 검색
      },
      limit: pageSize, // 원하는 개수만큼 데이터 가져오기
      order: [['createdAt', 'DESC']],
    });
    let isEnd;
    if (posts.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }

    const feed = await Promise.all(
      posts.map(async (post) => {
        const isMineValue = isMine(user, post);
        const { likesCount, isLikedValue } = (await isLike(user, post));
        const commentCount = await post.countComments();
        return {
          postId: post.postId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          commentCount,
          author: post.author,
          createdAt: post.createdAt,
          content: post.content,
          image: post.image,
        };
      }),
    );
    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, isEnd, feed });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function putGroupPost(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    if (!isMine(user, post)) {
      throw (new EditPermissionError());
    }

    const { content } = req.body;

    const previousPostImages = post.image?.split(', ');

    let modifiedPost;
    if (req.fileUrl !== null) {
      const fileUrl = req.fileUrl.join(', ');
      modifiedPost = await post.update({ content, image: fileUrl }, { transaction });
    } else {
      modifiedPost = await post.update({ content, image: null }, { transaction });
    }
    await deleteBucketImage(previousPostImages);
    const response = {
      ...{ message: '성공적으로 수정되었습니다.' },
      ...modifiedPost.dataValues,
    };

    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    await deleteBucketImage(req.fileUrl);
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteGroupPost(req, res, next) {
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
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, post))) {
      throw (new EditPermissionError());
    }
    const previousPostImage = post.image?.split(', ');
    await post.destroy({ transaction });

    await deleteBucketImage(previousPostImage);

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
      Post.findOne({ where: { groupId, postId }, transaction }),
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
    return res.status(201).json({ message: '성공적으로 등록되었습니다.' });
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
      Post.findOne({ where: { groupId, postId }, transaction }),
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
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const { content } = req.body;
    const comment = await post.createComment({ content }, { transaction });
    await user.addComments(comment, { transaction });

    const response = {
      ...{ message: '성공적으로 등록되었습니다.' },
      ...comment.dataValues,
    };

    await transaction.commit();
    return res.status(201).json(response);
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getSingleComment(req, res, next) {
  try {
    const { error: paramError } = validateCommentIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { postId, groupId } }),
      Comment.findOne({ where: { commentId, postId } }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    if (!comment) {
      throw (new CommentNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    comment.dataValues.isMine = isMine(user, comment);

    return res.status(200).json({ accessLevel, comment });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function getPostComment(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
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
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function putComment(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateCommentIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
      Comment.findOne({ where: { postId, commentId }, transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    if (!comment) {
      throw (new CommentNotFoundError());
    }

    if (!isMine(user, comment)) {
      throw (new EditPermissionError());
    }

    const { content } = req.body;
    const modifiedComment = await comment.update({ content }, { transaction });
    const response = {
      ...{ message: '성공적으로 수정되었습니다.' },
      ...modifiedComment.dataValues,
    };

    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function deleteComment(req, res, next) {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { error: paramError } = validateCommentIdSchema(req.params);
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
      Comment.findOne({ where: { postId, commentId }, transaction }),
    ]);

    if (!group) {
      throw (new GroupNotFoundError());
    }

    if (!post) {
      throw (new PostNotFoundError());
    }

    if (!comment) {
      throw (new CommentNotFoundError());
    }

    const accessLevel = await getAccessLevel(user, group);
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, comment))) {
      throw (new EditPermissionError());
    }

    await comment.destroy({ transaction });

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

async function getUserFeed(req, res, next) {
  try {
    const { error: queryError } = validateLastRecordIdSchema(req.query);
    if (queryError) {
      throw (new DataFormatError());
    }

    const { user } = req;
    const groups = (await user.getGroups()).map((group) => group.groupId);

    let { last_record_id: lastRecordId } = req.query;
    if (lastRecordId == 0) {
      lastRecordId = Number.MAX_SAFE_INTEGER;
    }

    const pageSize = 9;
    const posts = await Post.findAll({
      where: {
        [Op.and]: [
          {
            groupId: {
              [Op.in]: groups, // groups 배열의 값과 일치하는 groupId
            },
          },
          {
            postId: {
              [Op.lt]: lastRecordId, // postId가 lastRecordId보다 작은 레코드
            },
          },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: pageSize,
    });
    let isEnd;
    if (posts.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }
    const feed = await Promise.all(
      posts.map(async (post) => {
        const isMineValue = isMine(user, post);
        const { likesCount, isLikedValue } = (await isLike(user, post));
        const commentCount = await post.countComments();
        return {
          postId: post.postId,
          groupId: post.groupId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          commentCount,
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          content: post.content,
          image: post.image,
        };
      }),
    );

    return res.status(200).json({ isEnd, feed });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
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
