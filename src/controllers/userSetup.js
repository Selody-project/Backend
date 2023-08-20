// Model
const User = require('../models/user');
const UserGroup = require('../models/userGroup');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');

// Error
const {
  ApiError, DataFormatError,
  UserIsLeaderError,
  UserNotFoundError,
} = require('../errors');

// Validator
const {
  validateUserIdSchema,
} = require('../utils/validators');

async function userWithdrawal(req, res, next) {
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
  userWithdrawal, getUserSetup, updateUserSetUp,
};
