import User from '../models/user';
import Group from '../models/group';
import PersonalSchedule from '../models/personalSchedule';
import ApiError from '../errors/apiError';
import { validateUserIdSchema } from '../utils/validators';
import UserIsLeaderError from '../errors/user/UserIsLeaderError';

import { DataFormatError } from '../errors';

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

export {
  userWithdrawal,
};
