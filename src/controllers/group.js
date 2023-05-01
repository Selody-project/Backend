const { Op } = require('sequelize');
const moment = require('moment');
const { validateGroupSchema } = require('../utils/validators');
const GroupSchedule = require('../models/groupSchedule');

async function getGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupSchema(req.params);
    if (error) throw error;

    const { group_id: groupID } = req.params;

    const { date: dateString } = req.query;
    const start = moment(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment(start).add(1, 'month').startOf('month').toDate();

    const schedule = await GroupSchedule.findAll({
      where: {
        groupid: groupID,
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

module.exports = {
  getGroupSchedule,
};
