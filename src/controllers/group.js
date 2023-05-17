const Sequelize = require('sequelize');
const moment = require('moment');
const db = require('../models');
// const { Op } = Sequelize;
const { validateGroupSchema } = require('../utils/validators');
const User = require('../models/user');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');

async function createGroup(req, res, next) {
  try {
    const { nickname, name } = req.body;
    const exUser = await User.findOne({ where: { nickname } });
    const group = await Group.create({ name, member: 1 });
    await exUser.addGroup(group);
    return res.status(200).json({ message: 'Group creation successful' });
  } catch (err) {
    return next(err);
  }
}

async function getGroupList(req, res, next) {
  try {
    const exUser = await User.findOne({ where: { nickname: req.body.nickname } });
    const groupList = await exUser.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(err);
  }
}

async function getGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupSchema(req.params);
    if (error) throw error;

    const { group_id: groupID } = req.params;

    const { date: dateString } = req.query;
    const start = moment(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment(start).endOf('month').toDate();
    const query = `
    SELECT * FROM groupSchedule
    WHERE groupId = :groupID AND (
      ( 
        repetition = 0 AND ( 
          (startDate BETWEEN :start AND :end)
          OR
          (endDate BETWEEN :start AND :end)
          OR
          (startDate <= :start AND endDate >= :end)
        )
      ) 
      OR 
      ( 
        repetition = 1 AND startDate <= :end AND
        (
          month = '*'
          OR
          (DATEDIFF(endDate, startDate) >= 365)
          OR
          DATEDIFF(endDate, startDate) >= MOD(DATEDIFF(:start, startDate), 365)
        )
      )
    )
    `;
    const schedule = await db.sequelize.query(query, {
      replacements: { groupID, start, end },
      type: Sequelize.QueryTypes.SELECT,
    });
    return res.status(200).json({ schedule });
  } catch (err) {
    console.log(err);
    return next(err);
  }
}

async function postGroupSchedule(req, res, next) {
  try {
    const {
      groupId, title, startDate, endDate, content,
    } = req.body;
    await GroupSchedule.create({
      groupId,
      title,
      content,
      startDate,
      endDate,
      confirmed: 0,
      repetition: req.body.repetition || 0,
      possible: null,
      impossible: null,
    });
    return res.status(201).json({ message: 'Group Schedule creation successful' });
  } catch (err) {
    return next(err);
  }
}

async function putGroupSchedule(req, res, next) {
  try {
    const { id } = req.body;
    await GroupSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createGroup,
  getGroupList,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
};
