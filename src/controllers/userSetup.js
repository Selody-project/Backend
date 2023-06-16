const User = require('../models/user');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const { validateUserIdSchema } = require('../utils/validators');
const UserIsLeaderError = require('../errors/user/UserIsLeaderError');

const { DataFormatError } = require('../errors');

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
module.exports = {
  userWithdrawal,
};
