// model
import User from '../models/user';
import Group from '../models/group';
import PersonalSchedule from '../models/personalSchedule';

// error
import ApiError from '../errors/apiError';
import {
  DataFormatError, userErrors,
} from '../errors';

// validator
import {
  validateUserIdSchema,
} from '../utils/validators';

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
      return next(new userErrors.UserIsLeaderError());
    }

    return res.status(204).json({ message: 'Successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}

export {
  userWithdrawal,
};
