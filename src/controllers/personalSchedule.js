const moment = require('moment');
const { isMine } = require('../utils/accessLevel');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');

// Error
const {
  ApiError, DataFormatError,
  ScheduleNotFoundError, NotFoundError,
  EditPermissionError,
} = require('../errors');

// Validator
const {
  validateScheduleIdSchema, validateScheduleDateSchema, validateScheduleSchema,
} = require('../utils/validators');

async function postPersonalSchedule(req, res, next) {
  try {
    const { error: bodyError } = validateScheduleSchema(req.body);
    if (bodyError) {
      return next(new DataFormatError());
    }

    const { user } = req;

    const {
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;

    const schedule = await PersonalSchedule.create({
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

    return res.status(201).json({
      message: 'Successfully create user schedule',
      schedule,
    });
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
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    if (!isMine(user, schedule)) {
      return next(new EditPermissionError());
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

    const { user } = req;

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
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new ScheduleNotFoundError());
    }

    if (!isMine(user, schedule)) {
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
    const { user } = req;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new NotFoundError());
    }

    if (!isMine(user, schedule)) {
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
