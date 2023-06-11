const User = require('../models/user');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');

const ValidationError = require('../errors/calendar/ValidationError');

async function deleteWithdrawal(req, res, next) {
  const { userId } = req.body;

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
      return next(new ValidationError());
    }

    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (error) {
    return next(new ApiError());
  }
}
module.exports = {
  deleteWithdrawal,
};
