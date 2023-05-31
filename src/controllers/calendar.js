const { Op } = require('sequelize');
const moment = require('moment');
const personalSchedule = require('../models/personalSchedule');
const User = require('../models/user');
const ApiError = require('../errors/apiError');
const NotFoundError = require('../errors/calendar/NotFound');
const { UserNotFoundError } = require('../errors');

async function postPersonalSchedule(req, res, next) {
  const {
    title, content, startDateTime, endDateTime,
    recurrence, freq, interval, byweekday, until,
  } = req.body;
  try {
    const user = await User.findOne({ where: { nickname: req.nickname } });
    if (!user) {
      return next(new UserNotFoundError());
    }
    const { userId } = user;
    const newSchedule = await personalSchedule.create({
      userId,
      title,
      content,
      startDateTime: moment.utc(startDateTime).format('YYYY-MM-DD'),
      endDateTime: moment.utc(endDateTime).format('YYYY-MM-DD'),
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    });

    const scheduleArr = [{ ...newSchedule.toJSON() }];
    return res.status(201).json({ scheduleArr });
  } catch (error) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  const { id } = req.body;
  try {
    const data = await personalSchedule.destroy({
      where: {
        id: {
          [Op.or]: id,
        },
      },
    });
    if (data === 0) {
      return next(new NotFoundError());
    }
    return res.status(204).json({ message: 'successfully deleted' });
  } catch (error) {
    return next(new ApiError());
  }
}
module.exports = {
  postPersonalSchedule, deletePersonalSchedule,
};
