const { Op } = require('sequelize');
const moment = require('moment');
const { validateGroupSchema } = require('../utils/validators');
const User = require('../models/user');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');

// 와이어프레임에 그룹 생성 과정이 있었나?
// 없었으면 추가 필요할 듯
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
      repeat: req.body.repeat || 0,
      repeatType: req.body.repeatType || null,
      possible: null,
      impossible: null,
    });
    res.status(201).json({ message: 'Group Schedule creation successful' });
  } catch (err) {
    return next(err);
  }
}

async function putGroupSchedule(req, res, next) {
  try {
    const { id } = req.body;
    console.log(req.body);
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
