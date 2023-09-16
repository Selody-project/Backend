const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

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

async function getUserProfile(req, res, next) {
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });
    return res.status(200).json({
      user: {
        userId: user.userId,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserGroup(req, res, next) {
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserProfile(req, res, next) {
  try {
    const { error: bodyError } = validateProfileSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new UserNotFoundError());
    }

    const { nickname, email } = req.body;
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
      return next(new DuplicateUserError());
    }
    await user.update({ nickname, email });
    req.nickname = nickname;
    next();
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserPassword(req, res, next) {
  try {
    const { error: bodyError } = validatePasswordSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const { password } = req.body;

    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new UserNotFoundError());
    }

    await user.update({
      password: await bcrypt.hash(password, 12),
    });

    return res.status(200).end();
  } catch (err) {
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

    const user = await User.findOne({ where: { nickname: req.nickname } });
    const { updatedSharePersonalEvent } = req.body;

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
  getUserProfile,
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  withdrawal,
  getUserSetup,
  updateUserSetUp,
};
