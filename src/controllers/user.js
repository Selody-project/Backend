const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { deleteBucketImage } = require('../middleware/s3');

// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');

// Error
const {
  ApiError, DataFormatError,
  UserNotFoundError, DuplicateUserError, UserIsLeaderError, BelongToGroupError,
} = require('../errors');

// Validator
const {
  validateProfileSchema, validateUserIdSchema, validatePasswordSchema,
} = require('../utils/validators');

async function getUserGroup(req, res, next) {
  try {
    const { user } = req;
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserProfile(req, res, next) {
  try {
    if (!req.body?.data) {
      throw (new DataFormatError());
    }
    req.body = JSON.parse(req.body.data);

    const { error: bodyError } = validateProfileSchema(req.body);
    if (bodyError) {
      throw (new DataFormatError());
    }

    const { nickname, email } = req.body;
    const { user } = req;
    const duplicate = await User.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nickname },
              { email },
            ],
          },
          { userId: { [Op.not]: user.userId } },
        ],
      },
    });
    if (duplicate.length > 0) {
      throw (new DuplicateUserError());
    }
    const previousProfileImage = user.profileImage;
    if (req.fileUrl !== null) {
      await user.update({ nickname, email, profileImage: req.fileUrl });
      await deleteBucketImage(previousProfileImage);
    } else {
      await user.update({ nickname, email });
    }
    req.nickname = nickname;
    req.user = user;
    next();
  } catch (err) {
    await deleteBucketImage(req.fileUrl);
    if (!err || err.status === undefined) {
      return next(new ApiError());
    }
    return next(err);
  }
}

async function patchUserPassword(req, res, next) {
  try {
    const { error: bodyError } = validatePasswordSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const { password } = req.body;
    const { user } = req;

    await user.update({
      password: await bcrypt.hash(password, 12),
    });

    return res.status(200).end();
  } catch (err) {
    console.log(err);
    return next(new ApiError());
  }
}

async function withdrawal(req, res, next) {
  try {
    const { error: paramError } = validateUserIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { user_id: userId } = req.params;
    const [user, leader] = await Promise.all([
      User.findByPk(userId),
      Group.findOne({ where: { leader: userId } }),
    ]);
    if (!user) {
      return next(new UserNotFoundError());
    }

    if (leader) {
      return next(new UserIsLeaderError());
    }

    const groupList = await user.getGroups();
    if (groupList != 0) {
      return next(new BelongToGroupError());
    }

    await PersonalSchedule.destroy({ where: { userId } });
    await user.destroy();

    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserSetup(req, res, next) {
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function updateUserSetUp(req, res, next) {
  try {
    const { error: paramError } = validateUserIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { updatedSharePersonalEvent } = req.body;
    const { user } = req;

    const updatePromises = updatedSharePersonalEvent.map(async (groupSetup) => {
      const { groupId, sharePersonalEvent } = groupSetup;

      await UserGroup.update(
        { sharePersonalEvent },
        { where: { groupId, userId: user.userId } },
      );
    });
    await Promise.all(updatePromises);

    return res.status(200).json({ message: 'Successfully update User Setup ' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  withdrawal,
  getUserSetup,
  updateUserSetUp,
};
