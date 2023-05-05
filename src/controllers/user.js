const { Op } = require('sequelize');
const moment = require('moment');
const { validateUserIdSchema } = require('../utils/validators');
const PersonalSchedule = require('../models/personalSchedule');
const User = require('../models/user');

async function getUserSchedule(req, res, next) {
  try {
    const { error } = validateUserIdSchema(req.params);
    if (error) throw error;
    const { user_id: userID } = req.params;

    const { date: dateString } = req.query;
    const start = moment(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment(start).add(1, 'month').startOf('month').toDate();

    const schedule = await PersonalSchedule.findAll({
      where: {
        userId: userID,
        [Op.or]: [
          { startDate: { [Op.between]: [start, end] } },
          { endDate: { [Op.between]: [start, end] } },
          { startDate: { [Op.lte]: start }, endDate: { [Op.gte]: end } },
        ],
      },
    });

    return res.status(200).json({ schedule });
  } catch (err) {
    return next(err);
  }
}

async function getUserInfo(req, res) {
  const exUser = await User.findOne({
    where: {
      nickname: req.body.nickname,
    },
  });
  res.status(200).json({ exUser });
}

module.exports = {
  getUserSchedule,
  getUserInfo,
};
