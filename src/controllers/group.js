const Sequelize = require('sequelize');
const moment = require('moment');
const { RRule } = require('rrule');
const db = require('../models');
const User = require('../models/user');
const Group = require('../models/group');
const ApiError = require('../errors/apiError');
const GroupSchedule = require('../models/groupSchedule');
const DataFormatError = require('../errors/DataFormatError');
const {
  validateGroupSchema, validateGroupIdSchema,
  validateScheduleIdSchema, validateGroupScheduleSchema,
} = require('../utils/validators');
const { getRRuleByWeekDay, getRRuleFreq } = require('../utils/rrule');

async function createGroup(req, res, next) {
  try {
    const { error } = validateGroupSchema(req.body);
    if (error) return next(new DataFormatError());

    const { nickname } = req;
    const { name } = req.body;
    const exUser = await User.findOne({ where: { nickname } });
    const group = await Group.create({ name, member: 1 });
    await exUser.addGroup(group);
    return res.status(200).json({ message: 'Group creation successful' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupList(req, res, next) {
  try {
    const { nickname } = req;
    const exUser = await User.findOne({ where: { nickname } });
    const groupList = await exUser.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(new ApiError());
  }
}

async function getGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { group_id: groupID } = req.params;
    const { date: dateString } = req.query;

    const start = moment.utc(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment.utc(start).endOf('month').toDate();

    const nonRecurrenceStatement = `
      SELECT 
        title, 
        content, 
        startDateTime, 
        endDateTime, 
        recurrence 
      FROM 
        groupSchedule
      WHERE 
        groupId = :groupID AND (
        recurrence = 0 AND ( 
          (startDateTime BETWEEN :start AND :end)
          OR
          (endDateTime BETWEEN :start AND :end)
          OR
          (startDateTime < :start AND endDateTime > :end)
        )
      )`;
    const recurrenceStatement = `
      SELECT 
        * 
      FROM 
        groupSchedule
      WHERE 
        groupId = :groupID AND (
        recurrence = 1 AND 
        startDateTime <= :end
      )
      `;
    const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
      replacements: {
        groupID,
        start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
        end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
      },
      type: Sequelize.QueryTypes.SELECT,
    });
    const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
      replacements: {
        groupID,
        start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
        end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
      },
      type: Sequelize.QueryTypes.SELECT,
    });
    const recurrenceSchedule = [];
    recurrenceScheduleList.forEach((schedule) => {
      const byweekday = getRRuleByWeekDay(schedule.byweekday);
      let rrule;
      if (byweekday.length === 0) {
        rrule = new RRule({
          freq: getRRuleFreq(schedule.freq),
          interval: schedule.interval,
          dtstart: schedule.startDateTime,
          until: schedule.until,
        });
      } else {
        rrule = new RRule({
          freq: getRRuleFreq(schedule.freq),
          interval: schedule.interval,
          byweekday: getRRuleByWeekDay(schedule.byweekday),
          dtstart: schedule.startDateTime,
          until: schedule.until,
        });
      }
      const scheduleLength = (new Date(schedule.endDateTime) - new Date(schedule.startDateTime));
      const scheduleDateList = rrule.between(
        new Date(start.getTime() - scheduleLength),
        new Date(end.getTime() + 1),
      );
      const possibleDateList = [];
      scheduleDateList.forEach((scheduleDate) => {
        const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
        if (endDateTime >= start) {
          possibleDateList.push({ startDateTime: scheduleDate, endDateTime });
        }
      });
      if (possibleDateList.length !== 0) {
        recurrenceSchedule.push({
          id: schedule.id,
          groupId: schedule.groupId,
          title: schedule.title,
          content: schedule.content,
          recurrence: schedule.recurrence,
          freq: schedule.freq,
          interval: schedule.interval,
          byweekday: schedule.byweekday,
          until: schedule.until,
          recurrenceDateList: possibleDateList,
        });
      }
    });
    return res.status(200).json({ nonRecurrenceSchedule, recurrenceSchedule });
  } catch (err) {
    return next(new ApiError());
  }
}

async function postGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupScheduleSchema(req.body);
    if (error) return next(new DataFormatError());

    const {
      groupId,
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
    } = req.body;

    await GroupSchedule.create({
      groupId,
      title,
      content,
      startDateTime,
      endDateTime,
      recurrence,
      freq,
      interval,
      byweekday,
      until,
      possible: null,
      impossible: null,
    });
    return res.status(201).json({ message: 'Successfully create group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function putGroupSchedule(req, res, next) {
  try {
    const { error: paramError } = validateScheduleIdSchema(req.params);
    if (paramError) return next(new DataFormatError());

    const { error: bodyError } = validateGroupScheduleSchema(req.body);
    if (bodyError) return next(new DataFormatError());

    const { id } = req.params;
    await GroupSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully modify group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

async function deleteGroupSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { id } = req.params;
    const schedule = await GroupSchedule.findOne({ where: { id } });
    await schedule.destroy();
    return res.status(204).json({ message: 'Successfully delete group schedule' });
  } catch (err) {
    return next(new ApiError());
  }
}

module.exports = {
  createGroup,
  getGroupList,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
  deleteGroupSchedule,
};
