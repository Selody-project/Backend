// Model
const UserGroup = require('../models/userGroup');
const Like = require('../models/like');

// Error
const {
  ApiError,
} = require('../errors');

function isMine(user, content) {
  if (user.userId == content.userId) {
    return true;
  }
  return false;
}

async function isLike(user, post) {
  try {
    const association = await Like.findOne({
      where: {
        userId: user.userId,
        postId: post.postId,
      },
    });
    if (!association) {
      return false;
    }
    return true;
  } catch (err) {
    throw (new ApiError());
  }
}

async function getAccessLevel(user, group) {
  try {
    const association = await UserGroup.findOne({
      where: {
        userId: user.userId,
        groupId: group.groupId,
      },
    });
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
