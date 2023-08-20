const moment = require('moment');

// Model
const PersonalSchedule = require('../models/personalSchedule');
const User = require('../models/user');

// Error
const {
  ApiError, DataFormatError,
  UserNotFoundError, NotFoundError,
} = require('../errors');

// Validator
const {
  validateUserScheduleSchema, validateScheduleIdSchema,
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

async function deletePersonalSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) {
      return next(new DataFormatError());
    }

    const { schedule_id: scheduleId } = req.params;
    const schedule = await PersonalSchedule.findByPk(scheduleId);

    if (!schedule) {
      return next(new NotFoundError());
    }

    await schedule.destroy();

    return res.status(204).json({ message: 'successfully deleted' });
  } catch (err) {
    return next(new ApiError());
  }
}
module.exports = {
  postPersonalSchedule,
  deletePersonalSchedule,
};
