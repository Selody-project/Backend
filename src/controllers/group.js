const Sequelize = require('sequelize');
const moment = require('moment');
const { RRule } = require('rrule');
const db = require('../models');
const User = require('../models/user');
const Group = require('../models/group');
const GroupSchedule = require('../models/groupSchedule');
const { 
  validateGroupSchema, validateGroupIdSchema,
  validateScheduleSchema, validateScheduleIdSchema 
} = require('../utils/validators');

function getRRuleFreq(freq) {
  const RRuleFreq = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  };

  return RRuleFreq[freq];
}

function getRRuleByWeekDay(byweekday) {
  const arr = byweekday.split(',');
  const RRuleWeekDay = {
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
    SU: RRule.SU,
  };

  if (arr[0] === '') {
    return [];
  }

  return arr.map((str) => RRuleWeekDay[str]);
}

async function createGroup(req, res, next) {
  try {
    const { error } = validateGroupSchema(req.body);
    if (error) return next(new DataFormatError());

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
    const { nickname } = req.body;
    const exUser = await User.findOne({ where: { nickname } });
    const groupList = await exUser.getGroups();
    return res.status(200).json({ groupList });
  } catch (err) {
    return next(err);
  }
}

async function getGroupSchedule(req, res, next) {
  try {
    const { error } = validateGroupIdSchema(req.params);
    if (error) return next(new DataFormatError());

    const { group_id: groupID } = req.params;
    const { date: dateString } = req.query;

    // moment 라이브러리를 사용하여 생성된 Date 객체는
    // 로컬 타임존에 따라 자동으로 변환될 수 있음. 따라서 startUTC, endUTC로 다시 변환해줌.
    const start = moment.utc(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment.utc(start).endOf('month').toDate();
    const startUTC = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const endUTC = new Date(end.getTime() + start.getTimezoneOffset() * 60000);
    const nonRecurrenceStatement = `
      SELECT title, content, startDateTime, endDateTime, recurrence FROM groupSchedule
      WHERE groupId = :groupID AND (
        recurrence = 0 AND ( 
          (startDateTime BETWEEN :start AND :end)
          OR
          (endDateTime BETWEEN :start AND :end)
          OR
          (startDateTime < :start AND endDateTime > :end)
        )
      )`;
    const recurrenceStatement = `
      SELECT * FROM groupSchedule
      WHERE groupId = :groupID AND (
        recurrence = 1 AND 
        startDateTime <= :end
      )
      `;
    const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
      replacements: { groupID, start: startUTC, end: endUTC },
      type: Sequelize.QueryTypes.SELECT,
    });
    const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
      replacements: { groupID, start: startUTC, end: endUTC },
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
      const scheduleDateList = rrule.between(new Date(startUTC.getTime() - scheduleLength - 1), new Date(end.getTime() + 1));
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
      // console.log(JSON.stringify(recurrenceSchedule, null, 2));
    });
    return res.status(200).json({ nonRecurrenceSchedule, recurrenceSchedule });
  } catch (err) {
    return next(err);
  }
}

async function postGroupSchedule(req, res, next) {
  try {
    const { error } = validateScheduleSchema(req.body);
    if (error) return next(new DataFormatError());

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
      dayMonth: req.body.dayMonth || null,
      month: req.body.month || null,
      dayWeek: req.body.dayWeek || null,
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
    const { error } = validateScheduleSchema(req.body);
    if (error) return next(new DataFormatError());

    const { id } = req.body;
    await GroupSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(err);
  }
}

async function deleteGroupSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());
    
    const { id } = req.body;
    const schedule = await GroupSchedule.findOne({ where: { id } });
    await schedule.destroy();
    return res.status(200).json({ message: 'Group schedule deleted successfully.' });
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
  deleteGroupSchedule,
};
