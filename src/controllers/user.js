const moment = require('moment');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const DuplicateUserError = require('../errors/auth/DuplicateUserError');
const DataFormatError = require('../errors/DataFormatError');
const ScheduleNotFoundError = require('../errors/schedule/ScheduleNotFoundError');

const {
  validateJoinSchema,
  validateScheduleSchema,
  validateScheduleIdSchema,
  validateScheduleDateScehma,
} = require('../utils/validators');
const { UserNotFoundError } = require('../errors');
const GroupSchedule = require('../models/groupSchedule');

async function getUserProfile(req, res, next) {
  try {
    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
    return res.status(200).json({ user });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserGroup(req, res, next) {
  try {
    const { nickname } = req;
    const user = await User.findOne({ where: { nickname } });
    const groupList = await user.getGroups();
    return res.status(200).json({ groupList });
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
      return next(new UserNotFoundError());
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
      return next(new DuplicateUserError());
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

async function getUserPersonalSchedule(req, res, next) {
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
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
      const event = {};
      event.nonRecurrenceSchedule = [
        ...userEvent.nonRecurrenceSchedule,
        ...groupEvent.nonRecurrenceSchedule,
      ];
      event.recurrenceSchedule = [
        ...userEvent.recurrenceSchedule,
        ...groupEvent.recurrenceSchedule,
      ];
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
      return next(new ScheduleNotFoundError());
    }

    await PersonalSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getUserProfile,
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  getUserPersonalSchedule,
  putUserSchedule,
};
