const moment = require('moment');

// Model
const User = require('../models/user');
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');

// Error
const {
  ApiError, DataFormatError,
  UserNotFoundError, ScheduleNotFoundError, NotFoundError,
  EditPermissionError,
} = require('../errors');

// Validator
const {
  validateUserScheduleSchema, validateScheduleIdSchema, validateScheduleDateSchema,
  validateScheduleSchema,
} = require('../utils/validators');

async function postPersonalSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateUserScheduleSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const user = await User.findOne({ where: { nickname: req.nickname } });

    if (!user) {
      return next(new UserNotFoundError());
    }

    const {
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    await PersonalSchedule.create({
      userId: user.userId,
      title,
      content,
      startDateTime: moment.utc(startDateTime).format('YYYY-MM-DD HH:mm:ss'),
      endDateTime: moment.utc(endDateTime).format('YYYY-MM-DD HH:mm:ss'),
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    });

    return res.status(201).json({ message: 'Successfully create user schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getSingleUserSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    return res.status(200).json(schedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalSchedule(req, res, next) {
  try {
    const { error: queryError } = validateScheduleDateSchema(req.query);
    if (queryError) {
      return next(new DataFormatError());
    }

    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
    }

    const { startDateTime, endDateTime } = req.query;
    const start = moment.utc(startDateTime).toDate();
    const end = moment.utc(endDateTime).toDate();

    const userEvent = await PersonalSchedule.getSchedule([user.userId], start, end);
    const groups = (await user.getGroups()).map((group) => group.groupId);
    if (groups.length) {
      const groupEvent = await GroupSchedule.getSchedule(groups, start, end);
      let event;
      if (userEvent.earliestDate > groupEvent.earliestDate) {
        event = { earliestDate: groupEvent.earliestDate };
      } else {
        event = { earliestDate: userEvent.earliestDate };
      }
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

async function putPersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    const { error: bodyError } = validateScheduleSchema(req.body);

    if (paramError || bodyError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const [user, schedule] = await Promise.all([
      User.findOne({ where: { nickname: req.nickname } }),
      PersonalSchedule.findByPk(scheduleId),
    ]);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    if (user.userId !== schedule.userId) {
      return next(new EditPermissionError());
    }

    await PersonalSchedule.update(req.body, { where: { id: scheduleId } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const [schedule, user] = await Promise.all([
      PersonalSchedule.findByPk(scheduleId),
      User.findOne({ where: { nickname: req.nickname } }),
    ]);

    if (!schedule) {
      return next(new NotFoundError());
    }

    if (user.userId !== schedule.userId) {
      return next(new EditPermissionError());
    }

    await schedule.destroy();

    return res.status(204).json({ message: 'successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}
module.exports = {
  postPersonalSchedule,
  getSingleUserSchedule,
  getUserPersonalSchedule,
  putPersonalSchedule,
  deletePersonalSchedule,
};
