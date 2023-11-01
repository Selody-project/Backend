// Model
const UserGroup = require('../models/userGroup');
const Like = require('../models/like');

// Error
const {
  ApiError,
} = require('../errors');

// 사용자가 content의 소유자인지 판별
function isMine(user, content) {
  if (user.userId == content.userId) {
    return true;
  }
  return false;
}

// post에 대한 사용자의 like 여부 판별
async function isLike(user, post) {
  try {
    let isLikedValue;
    const association = await Like.findOne({
      where: {
        userId: user.userId,
        postId: post.postId,
      },
    });
    if (association) {
      isLikedValue = true;
    } else {
      isLikedValue = false;
    }
    const { count } = await Like.findAndCountAll({
      where: {
        postId: post.postId,
      },
    });
    return { likesCount: count, isLikedValue };
  } catch (err) {
    throw (new ApiError());
  }
}

// 사용자 그룹 접근 권한 조회
async function getAccessLevel(user, group) {
  try {
    const association = await UserGroup.findOne({
      where: {
        userId: user.userId,
        groupId: group.groupId,
      },
    });
    // 그룹에 속하지 않은 사람들은 따로 처리를 해야함. 수정 필요.
    if (!association) {
      return 'viewer';
    }
    return association.accessLevel;
  } catch (err) {
    throw (new ApiError());
  }
}

module.exports = {
  isMine,
  isLike,
  getAccessLevel,
};
