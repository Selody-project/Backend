const User = require('../models/user');
const Group = require('../models/group');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');

const { ValidationError } = require('../errors/calendar/ValidationError');

async function deleteWithdrawal(req, res, next) {
  const { userId } = req;
  const user = await User.findOne({ where: { userId } });

  console.log(user);
  try {
    const leader = await Group.findOne({
      wehre: {
        leader: user.userId,
      },
    });
    if (!leader) {
    // personalSchedule model에서 personalScheulde 삭제하기
    // user 삭제하기
      console.log(leader);
      await PersonalSchedule.destroy({ where: { userId } });
      // await User.destroy({ where: { userId } });
      await user.destroy();
    } else {
      return next(new ValidationError());
    }
  } catch (error) {
    return next(new ApiError());
  }
}
module.exports = {
  deleteWithdrawal,
};
