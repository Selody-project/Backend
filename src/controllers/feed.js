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
const User = require('../models/user');
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

// 그룹 포스트 등록
async function postGroupPost(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      // 데이터 형식 Error
      throw (new DataFormatError());
    }

    // JSON 데이터 파싱
    req.body = JSON.parse(req.body.data);
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    // 그룹 ID 또는 게시물 형식 오류 발생 시 Error
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;
    const { user } = req;
    const group = await Group.findByPk(groupId);

    // 그룹이 존재하지 않을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 사용자의 그룹 접근 권한 확인
    const accessLevel = await getAccessLevel(user, group);

    // 편집 권한 없을 때 Error
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const { content } = req.body;

    let post;
    if (req.fileUrl !== null) {
      // 피드에 이미지 파일이 첨부된 경우
      const fileUrl = req.fileUrl.join(', ');
      post = await Post.create({ author: req.nickname, content, image: fileUrl }, { transaction });
    } else {
      // 파일이 첨부되지 않은 경우
      post = await Post.create({ author: req.nickname, content }, { transaction });
    }

    // 사용자와 그룹에 게시물 연결
    await user.addPosts(post, { transaction });
    await group.addPosts(post, { transaction });

    post.dataValues.author = user.nickname;
    post.dataValues.authorImage = user.profileImage;
    // 응답 데이터 생성
    const response = {
      ...{ message: '성공적으로 등록되었습니다.' },
      ...post.dataValues,
    };

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(201).json(response);
  } catch (err) {
    // 오류 발생 시 처리 (버킷에 등록된 이미지를 삭제. rollback 과정)
    await deleteBucketImage(req.fileUrl);
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 단일 포스트의 정보를 조회
async function getSinglePost(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    // 게시물 ID 형식 오류 발생 시 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;

    // 그룹과 게시물 동시 조회
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({
        where: { groupId, postId },
        include: [
          {
            model: User,
            attributes: ['userId', 'nickname', 'profileImage'],
          },
        ],
      }),
    ]);

    // 그룹이 존재하지 않을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 포스트가 존재하지 않을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 사용자의 그룹 접근 권한 확인
    const accessLevel = await getAccessLevel(user, group);

    // 사용자가 게시물 작성자인지 확인
    const isMineValue = isMine(user, post);

    // 게시물 좋아요 정보 확인
    const { likesCount, isLikedValue } = (await isLike(user, post));

    // 게시물의 댓글 수 확인
    const commentCount = await post.countComments();

    return res.status(200).json({
      accessLevel,
      post: {
        postId: post.postId,
        isMine: isMineValue,
        isLiked: isLikedValue,
        likesCount,
        commentCount,
        author: post.User.dataValues.nickname,
        authorImage: post.User.dataValues.profileImage,
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

// 그룹 피드 조회
async function getGroupPosts(req, res, next) {
  try {
    const { error: paramError } = validateGroupIdSchema(req.params);
    const { error: queryError } = validateLastRecordIdSchema(req.query);
    // 요청된 매개변수나 쿼리 형식 Error
    if (paramError || queryError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId } = req.params;

    // 스크롤의 마지막에 해당하는 포스트의 ID를 query값으로 받아옴
    // 첫 페이지 조회 시에는 이 값을 0으로 받아옴
    let { last_record_id: lastRecordId } = req.query;
    if (lastRecordId == 0) {
      lastRecordId = Number.MAX_SAFE_INTEGER;
    }

    const { user } = req;
    const group = await Group.findByPk(groupId);

    // 그룹이 존재하지 않을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    const pageSize = 9;

    const posts = await Post.findAll({
      where: {
        groupId,
        postId: { [Sequelize.Op.lt]: lastRecordId }, // ID가 지정한 ID보다 작은(더 오래된) 레코드 검색
      },
      include: [
        {
          model: User,
          attributes: ['userId', 'nickname', 'profileImage'],
        },
      ],
      limit: pageSize, // 원하는 개수만큼 데이터 가져오기
      order: [['createdAt', 'DESC']], // 최신순으로 정렬
    });

    // 해당 페이지가 마지막 페이지인지를 판별
    let isEnd;
    if (posts.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }

    const feed = await Promise.all(
      posts.map(async (post) => {
        // 사용자가 게시물 작성자인지 확인
        const isMineValue = isMine(user, post);
        // 게시물 좋아요 정보 확인
        const { likesCount, isLikedValue } = (await isLike(user, post));
        // 게시물 댓글 수 확인
        const commentCount = await post.countComments();
        return {
          postId: post.postId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          commentCount,
          author: post.User.dataValues.nickname,
          authorImage: post.User.dataValues.profileImage,
          createdAt: post.createdAt,
          content: post.content,
          image: post.image,
        };
      }),
    );
    // 사용자의 그룹 접근 권한 확인
    const accessLevel = await getAccessLevel(user, group);
    return res.status(200).json({ accessLevel, isEnd, feed });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 그룹 포스트 수정
async function putGroupPost(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    if (!req.body?.data) {
      // data에 아무런 값이 없으면 Error
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validatePostSchema(req.body);

    // 매개변수나 본문 데이터 형식 Error
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    // 그룹이 존재하지 않을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물이 존재하지 않을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 수정 권한이 없을 때 Error
    if (!isMine(user, post)) {
      throw (new EditPermissionError());
    }

    const { content } = req.body;

    // 기존 포스트의 첨부 이미지 주소
    const previousPostImages = post.image?.split(', ');

    let modifiedPost;
    if (req.fileUrl !== null) {
      // 첨부 이미지 파일이 존재할 때
      const fileUrl = req.fileUrl.join(', ');
      // 새로 등록된 이미지 주소로 업데이트
      modifiedPost = await post.update({ content, image: fileUrl }, { transaction });
    } else {
      // 이미지 파일이 없을 때
      modifiedPost = await post.update({ content, image: null }, { transaction });
    }

    modifiedPost.dataValues.author = user.nickname;
    modifiedPost.dataValues.authorImage = user.profileImage;

    // 수정 전에 등록되어 있었던 이미지를 버킷에서 모두 삭제
    await deleteBucketImage(previousPostImages);
    const response = {
      ...{ message: '성공적으로 수정되었습니다.' },
      ...modifiedPost.dataValues,
    };

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    // 오류 발생 시, rollback
    await deleteBucketImage(req.fileUrl);
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 그룹 포스트 삭제
async function deleteGroupPost(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();

    const { error: paramError } = validatePostIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물이 존재하지 않을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 그룹 접근 권한을 조회
    const accessLevel = await getAccessLevel(user, group);

    // 권한이 없는 경우 Error
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, post))) {
      throw (new EditPermissionError());
    }

    // 첨부 이미지 주소
    const previousPostImage = post.image?.split(', ');

    // DB와 버킷에서 모두 삭제
    await post.destroy({ transaction });
    await deleteBucketImage(previousPostImage);

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(204).end();
  } catch (err) {
    // 오류 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 그룹 포스트 좋아요
async function postGroupPostLike(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);

    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId, { transaction }),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 그룹 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);
    // 접근 권한이 없는 경우 Error
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const existingLike = await Like.findOne({
      where: {
        userId: user.userId,
        postId: post.postId,
      },
      transaction,
    });

    // 중복 좋아요 Error
    if (existingLike) {
      throw (new DuplicateLikeError());
    }

    // like를 user와 post 테이블에 연결
    const like = await Like.create({}, { transaction });
    await user.addLike(like, { transaction });
    await post.addLikes(like, { transaction });

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(201).json({ message: '성공적으로 등록되었습니다.' });
  } catch (err) {
    // 에러 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 그룹 포스트 좋아요 삭제
async function deleteGroupPostLike(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw new DataFormatError();
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId, { transaction }),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시글을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 그룹 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);

    // 접근 권한이 없는 경우 Error
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

    // 좋아요를 누르지 않은 게시글일 때 Error
    if (!like) {
      throw (new DuplicateLikeError());
    }

    // 삭제 처리
    await like.destroy({ transaction });

    // 트랜잭션 커밋
    await transaction.commit();

    return res.status(204).end();
  } catch (err) {
    // 에러 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 댓글 생성
async function postComment(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    const { error: paramError } = validatePostIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    // 매개변수 형식 또는 body 형식 Error
    if (paramError || bodyError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId }, transaction }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 그룹 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);

    // 권한이 없는 경우 Error
    if (accessLevel === 'viewer') {
      throw (new EditPermissionError());
    }

    const { content } = req.body;
    // 댓글 생성 후, User 테이블에 연결
    const comment = await post.createComment({ content }, { transaction });
    await user.addComments(comment, { transaction });

    comment.dataValues.author = user.nickname;
    comment.dataValues.authorImage = user.profileImage;
    const response = {
      ...{ message: '성공적으로 등록되었습니다.' },
      ...comment.dataValues,
    };

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(201).json(response);
  } catch (err) {
    // 오류 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 단일 댓글 조회
async function getSingleComment(req, res, next) {
  try {
    const { error: paramError } = validateCommentIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId, comment_id: commentId } = req.params;
    const { user } = req;
    const [group, post, comment] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { postId, groupId } }),
      Comment.findOne({
        where: {
          commentId,
          postId,
        },
        include: [
          {
            model: User,
            attributes: ['userId', 'nickname', 'profileImage'],
          },
        ],
      }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시글을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 댓글을 찾을 수 없을 때 Error
    if (!comment) {
      throw (new CommentNotFoundError());
    }

    // 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);

    const response = {
      commentId: comment.commentId,
      content: comment.content,
      depth: comment.depth,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      userId: comment.userId,
      isMine: isMine(user, comment),
      author: comment.User.dataValues.nickname,
      authorImage: comment.User.dataValues.profileImage,
    };

    return res.status(200).json({ accessLevel, comment: response });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 단일 포스트에 달린 모든 댓글 조회
async function getPostComment(req, res, next) {
  try {
    const { error: paramError } = validatePostIdSchema(req.params);
    // 매개변수 형식 Error
    if (paramError) {
      throw (new DataFormatError());
    }

    const { group_id: groupId, post_id: postId } = req.params;
    const { user } = req;
    const [group, post, comments] = await Promise.all([
      Group.findByPk(groupId),
      Post.findOne({ where: { groupId, postId } }),
      Comment.findAll({
        where: {
          postId,
        },
        include: [
          {
            model: User,
            attributes: ['userId', 'nickname', 'profileImage'],
          },
        ],
      }),
    ]);

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 사용자 그룹 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);
    const response = comments.map((comment) => ({
      commentId: comment.commentId,
      content: comment.content,
      depth: comment.depth,
      author: comment.User.dataValues.nickname,
      authorImage: comment.User.dataValues.profileImage,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      userId: comment.userId,
      isMine: isMine(user, comment), // 사용자가 댓글의 작성자인지 여부
    }));

    return res.status(200).json({ accessLevel, comment: response });
  } catch (err) {
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 댓글 수정
async function putComment(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    const { error: paramError } = validateCommentIdSchema(req.params);
    const { error: bodyError } = validateCommentSchema(req.body);

    // 매개변수 또는 body 형식 Error
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

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 댓글을 찾을 수 없을 때 Error
    if (!comment) {
      throw (new CommentNotFoundError());
    }

    // 사용자가 댓글의 작성자가 아닌 경우 Error
    if (!isMine(user, comment)) {
      throw (new EditPermissionError());
    }

    // 댓글 수정
    const { content } = req.body;
    const modifiedComment = await comment.update({ content }, { transaction });
    modifiedComment.dataValues.author = user.nickname;
    modifiedComment.dataValues.authorImage = user.profileImage;
    const response = {
      ...{ message: '성공적으로 수정되었습니다.' },
      ...modifiedComment.dataValues,
    };

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(200).json(response);
  } catch (err) {
    // 오류 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 댓글 삭제
async function deleteComment(req, res, next) {
  let transaction;
  try {
    // 트랜잭션 시작
    transaction = await sequelize.transaction();
    const { error: paramError } = validateCommentIdSchema(req.params);
    // 매개변수 형식 Error
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

    // 그룹을 찾을 수 없을 때 Error
    if (!group) {
      throw (new GroupNotFoundError());
    }

    // 게시물을 찾을 수 없을 때 Error
    if (!post) {
      throw (new PostNotFoundError());
    }

    // 댓글을 찾을 수 없을 때 Error
    if (!comment) {
      throw (new CommentNotFoundError());
    }

    // 사용자 그룹 접근 권한 조회
    const accessLevel = await getAccessLevel(user, group);

    // 권한이 없는 경우 Error
    if (accessLevel === 'viewer' || (accessLevel === 'regular' && !isMine(user, comment))) {
      throw (new EditPermissionError());
    }

    // 댓글 삭제
    await comment.destroy({ transaction });

    // 트랜잭션 커밋
    await transaction.commit();
    return res.status(204).end();
  } catch (err) {
    // 오류 발생 시 rollback
    await transaction.rollback();

    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

// 사용자가 속한 모든 그룹을 고려하여 최신 피드 조회
async function getUserFeed(req, res, next) {
  try {
    const { error: queryError } = validateLastRecordIdSchema(req.query);
    // 쿼리 형식 Error
    if (queryError) {
      throw (new DataFormatError());
    }

    const { user } = req;
    const groups = (await user.getGroups()).map((group) => group.groupId);

    // 스크롤의 마지막에 해당하는 포스트의 ID를 query값으로 받아옴
    // 첫 페이지 조회 시에는 이 값을 0으로 받아옴
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
      include: [
        {
          model: User,
          attributes: ['userId', 'nickname', 'profileImage'],
        },
      ],
      order: [['createdAt', 'DESC']], // 최신 순으로 조회
      limit: pageSize,
    });

    // 해당 response가 페이지의 마지막 데이터를 담고 있는지 여부
    let isEnd;
    if (posts.length < pageSize) {
      isEnd = true;
    } else {
      isEnd = false;
    }

    const feed = await Promise.all(
      posts.map(async (post) => {
        // 사용자가 게시물 작성자인지 확인
        const isMineValue = isMine(user, post);
        // 게시물 좋아요 정보 확인
        const { likesCount, isLikedValue } = (await isLike(user, post));
        // 게시물의 댓글 수 확인
        const commentCount = await post.countComments();
        return {
          postId: post.postId,
          groupId: post.groupId,
          isMine: isMineValue,
          isLiked: isLikedValue,
          likesCount,
          commentCount,
          title: post.title,
          author: post.User.dataValues.nickname,
          authorImage: post.User.dataValues.profileImage,
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
