const User = require('../models/user');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
// const validateUserIdSchema = require('../utils/validators');
const UserIsLeaderError = require('../errors/user/UserIsLeaderError');
const PersonalScheduleNotDeleted = require('../errors/user/PersonalScheduleNotDeleted');
const UserNotDeletedError = require('../errors/user/UserNotDeletedError');

// const { DataFormatError } = require('../errors');

async function userWithdrawal(req, res, next) {
  // const { error } = validateUserIdSchema(req.params);
  // if (error) return next(new DataFormatError());

  const { id: userId } = req.params;
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

      const findPersonalSchedule = await PersonalSchedule.findOne({ where: { userId } });
      const userDelete = await User.findOne({ where: { userId } });

      if (findPersonalSchedule) {
        return next(new PersonalScheduleNotDeleted());
      }
      if (userDelete) {
        return next(new UserNotDeletedError());
      }
    } else {
      return next(new UserIsLeaderError());
    }

    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}
module.exports = {
  userWithdrawal,
};
