const { Op } = require('sequelize');
const moment = require('moment');
const personalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const NotFoundError = require('../errors/calendar/NotFound');

async function postPersonalSchedule(req, res, next) {
  const {
    userId, title, content, startDateTime, endDateTime,
    recurrence, freq, interval, byweekday, until,
  } = req.body;
  try {
    const newSchedule = await personalSchedule.create({
      userId,
      title,
      content,
      startDateTime: moment(startDateTime).format('YYYY-MM-DD'),
      endDateTime: moment(endDateTime).format('YYYY-MM-DD'),
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
