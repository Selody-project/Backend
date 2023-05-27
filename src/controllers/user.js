const moment = require('moment');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const PersonalSchedule = require('../models/personalSchedule');
const ApiError = require('../errors/apiError');
const DataFormatError = require('../errors/DataFormatError');
const {
  validateJoinSchema,
  validateUserIdSchema,
  validateScheduleSchema,
} = require('../utils/validators');

async function getUserProfile(req, res, next) {
  try {
    const { nickname } = req;
    const exUser = await User.findOne({ where: { nickname } });
    return res.status(200).json({ exUser });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putUserProfile(req, res, next) {
  try {
    const { error } = validateJoinSchema(req.body);
    if (error) return next(new DataFormatError());

    const exUser = await User.findOne({ where: { nickname: req.nickname } });
    const { nickname, password } = req.body;
    await exUser.update({
      nickname,
      password: await bcrypt.hash(password, 12),
    });
    req.nickname = nickname;
    next();
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalMonthSchedule(req, res, next) {
  try {
    const { error } = validateUserIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { user_id: userID } = req.params;
    const { date: dateString } = req.query;

    // moment 라이브러리를 사용하여 생성된 Date 객체는
    // 로컬 타임존에 따라 자동으로 변환될 수 있음. 따라서 startUTC, endUTC로 다시 변환해줌.
    const start = moment.utc(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment.utc(start).endOf('month').toDate();
    const startUTC = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const endUTC = new Date(end.getTime() + start.getTimezoneOffset() * 60000);
    const schedule = await PersonalSchedule.getSchedule(userID, start, end, startUTC, endUTC);
    if (schedule === null) throw new ApiError();
    return res.status(200).json(schedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function getUserPersonalDaySchedule(req, res, next) {
  try {
    const { error } = validateUserIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { user_id: userID } = req.params;
    const { date: dateString } = req.query;

    const start = moment.utc(dateString, 'YYYY-MM-DD').startOf('day').toDate();
    const end = moment.utc(start).endOf('day').toDate();
    const startUTC = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const endUTC = new Date(end.getTime() + start.getTimezoneOffset() * 60000);
    const schedule = await PersonalSchedule.getSchedule(userID, start, end, startUTC, endUTC);
    if (schedule === null) throw new ApiError();
    return res.status(200).json(schedule);
  } catch (err) {
    return next(new ApiError());
  }
}

async function putUserSchedule(req, res, next) {
  try {
    const { error } = validateScheduleSchema(req.params);
    if (error) return next(new DataFormatError());
    const { id } = req.body;
    await PersonalSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  getUserProfile,
  putUserProfile,
  getUserPersonalMonthSchedule,
  getUserPersonalDaySchedule,
  putUserSchedule,
};
