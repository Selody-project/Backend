const { Op } = require('sequelize');
const moment = require('moment');
const { validateUserIdSchema } = require('../utils/validators');
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');
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

async function getUserDaySchedule(req, res, next) {
  try {
    const curr = new Date();
    //    const weekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const start = moment(curr).startOf('day').add(9, 'hours').toDate();
    const end = moment(curr).endOf('day').add(9, 'hours').toDate();
    const exUser = await User.findOne({ where: { userId: req.params.user_id } });
    const dateOpt = [
      { startDate: { [Op.between]: [start, end] } },
      { endDate: { [Op.between]: [start, end] } },
      { startDate: { [Op.lte]: start }, endDate: { [Op.gte]: end } },
    ];
    /*
    const repetitionOpt = [
    ]
*/
    const userSchedules = await PersonalSchedule.findAll({
      where: {
        userId: req.params.user_id,
        [Op.or]: [{
          repetition: 0,
          [Op.or]: dateOpt,
        },
        ],
      },
    });
    const groups = await exUser.getGroups({ attributes: ['groupId'] });
    const groupOpt = [];
    groups.forEach((element) => {
      groupOpt.push({ groupId: element.dataValues.groupId, confirmed: 1 });
    });
    const groupSchedules = await GroupSchedule.findAll({
      where: {
        [Op.or]: groupOpt,
        [Op.or]: dateOpt,
      },
    });
    return res.status(200).json({ userSchedules, groupSchedules });
  } catch (err) {
    return next(err);
  }
}

async function getUserInfo(req, res, next) {
  try {
    const exUser = await User.findOne({ where: { nickname: req.body.nickname } });
    return res.status(200).json({ exUser });
  } catch (err) {
    return next(err);
  }
}

async function putUserSchedule(req, res, next) {
  try {
    const { id } = req.body;
    await PersonalSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getUserSchedule,
  getUserDaySchedule,
  getUserInfo,
  putUserSchedule,
};
