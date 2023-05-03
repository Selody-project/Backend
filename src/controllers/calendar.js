const { Op } = require('sequelize');
const personalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const NotNullValidationError = require('../errors/calendar/NotNullValidationError');
const NotFoundError = require('../errors/calendar/NotFound');

async function postPersonalSchedule(req, res, next) {
  const {
    userId, title, content, startDate, endDate, repeat,
  } = req.body;
  let { repeatType } = req.body;
  if (repeatType == 1) repeatType = 'YEAR';
  else if (repeatType == 2) repeatType = 'MONTH';
  else if (repeatType == 3) repeatType = 'WEEK';
  else repeatType = 'DAY';
  try {
    if (title && startDate && endDate) {
      const newSchedule = await personalSchedule.create({
        userId,
        title,
        content,
        startDate,
        endDate,
        repeat,
        repeatType,
      });

      const scheduleArr = [{ ...newSchedule.toJSON() }];
      return res.status(201).json({ scheduleArr });
    }
    return next(new NotNullValidationError());
  } catch (error) {
    return next(new ApiError());
  }
}

async function deletePersonalSchedule(req, res, next) {
  const { id } = req.params;
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
