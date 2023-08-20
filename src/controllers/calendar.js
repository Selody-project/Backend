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
    const { error } = validateUserScheduleSchema(req.body);
    if (error) {
      return next(new DataFormatError());
    }
    const {
      title, content, startDateTime, endDateTime,
      recurrence, freq, interval, byweekday, until,
    } = req.body;
    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
    }
    const { userId } = user;
    await PersonalSchedule.create({
      userId,
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
  } catch (error) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

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
