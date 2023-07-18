const User = require('../models/user');
const Group = require('../models/group');

const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const { validateUserIdSchema } = require('../utils/validators');
const UserIsLeaderError = require('../errors/user/UserIsLeaderError');

const { DataFormatError } = require('../errors');
const UserGroup = require('../models/userGroup');

async function userWithdrawal(req, res, next) {
  const { error } = validateUserIdSchema(req.params);
  if (error) return next(new DataFormatError());

  const { user_id: userId } = req.params;
  try {
    const user = await User.findOne({ where: { userId } });
    const leader = await Group.findOne({
      where: {
        leader: user.userId,
      },
    });
    if (!leader) {
      await PersonalSchedule.destroy({ where: { userId } });
      await user.destroy();
    } else {
      return next(new UserIsLeaderError());
    }
    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserSetup(req, res, next) {
  try {
    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function updateUserSetUp(req, res, next) {
  try {
    const { error } = validateUserIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
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
