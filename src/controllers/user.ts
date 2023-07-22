import moment = require('moment');
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

// model
import User from '../models/user';
import PersonalSchedule from '../models/personalSchedule';
import GroupSchedule from '../models/groupSchedule';

// error
import ApiError from '../errors/apiError';
import {
  DataFormatError, userErrors, scheduleErrors, authErrors,
} from '../errors';

// validator
import {
  validateJoinSchema,
  validateScheduleSchema,
  validateScheduleIdSchema,
  validateScheduleDateScehma,
} from '../utils/validators';

async function getUserProfile(req, res, next) {
  try {
    const { nickname } = req;

    const user = await User.findOne({ where: { nickname } });

    return res.status(200).json({ user });
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserProfile(req, res, next) {
  try {
    const { error } = validateJoinSchema(req.body);

    if (error) return next(new DataFormatError());

    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new userErrors.UserNotFoundError());
    }

    const { nickname } = req.body;

    const duplicate = await User.findAll({
      where: {
        [Op.and]: [
          { nickname },
          { userId: { [Op.not]: user.userId } },
        ],
      },
    });

    if (duplicate.length > 0) {
      return next(new authErrors.DuplicateUserError());
    }

    await user.update({
      nickname,
    });

    req.nickname = nickname;
    next();
  } catch (err) {
    return next(new ApiError());
  }
}

async function patchUserPassword(req, res, next) {
  try {
    const { error } = validateJoinSchema(req.body);

    if (error) return next(new DataFormatError());

    const { password } = req.body;

    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new userErrors.UserNotFoundError());
    }

    await user.update({
      password: await bcrypt.hash(password, 12),
    });

    return res.status(200).end();
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalSchedule(req, res, next) {
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new userErrors.UserNotFoundError());
    }

    const { error: queryError } = validateScheduleDateScehma(req.query);

    if (queryError) return next(new DataFormatError());

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    const userEvent = await PersonalSchedule.getSchedule([user.userId], start, end);

    const groups = (await user.getGroups()).map((group) => group.groupId);

    if (groups.length) {
      const groupEvent = await GroupSchedule.getSchedule(groups, start, end);

      const event: {
        nonRecurrenceSchedule: Array<GroupSchedule>;
        recurrenceSchedule: Array<GroupSchedule>;
      } = {
        nonRecurrenceSchedule: [
          ...userEvent.nonRecurrenceSchedule,
          ...groupEvent.nonRecurrenceSchedule,
        ],
        recurrenceSchedule: [
          ...userEvent.recurrenceSchedule,
          ...groupEvent.recurrenceSchedule,
        ],
      };

      return res.status(200).json(event);
    }

    return res.status(200).json(userEvent);
  } catch (err) {
    return next(new ApiError());
  }
}

async function putUserSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) return next(new DataFormatError());

    const { error: bodyError } = validateScheduleSchema(req.body);
    if (bodyError) return next(new DataFormatError());

    const { id } = req.params;
    const schedule = await PersonalSchedule.findOne({ where: { id } });

    if (!schedule) {
      return next(new scheduleErrors.ScheduleNotFoundError());
    }

    await PersonalSchedule.update(req.body, { where: { id } });

    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(new ApiError());
  }
}

export {
  getUserProfile,
  patchUserProfile,
  patchUserPassword,
  getUserPersonalSchedule,
  putUserSchedule,
};
