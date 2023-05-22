const { Op } = require('sequelize');
const moment = require('moment');
const PersonalSchedule = require('../models/personalSchedule');
const GroupSchedule = require('../models/groupSchedule');
const User = require('../models/user');
const { 
  validateUserIdSchema,
  validateScheduleSchema, validateScheduleIdSchema 
} = require('../utils/validators');

async function getUserInfo(req, res, next) {
  try {
    const { nickname } = req.body;
    const exUser = await User.findOne({ where: { nickname } });
    return res.status(200).json({ exUser });
  } catch (err) {
    return next(err);
  }
}

async function putUserSchedule(req, res, next) {
  try {
    const { error } = validateScheduleIdSchema(req.params);
    if (error) return next(new DataFormatError());
    const { id } = req.body;
    await PersonalSchedule.update(req.body, { where: { id } });
    return res.status(201).json({ message: 'Successfully Modified.' });
  } catch (err) {
    return next(err);
  }
}

async function getSchedule(userID, start, end, startUTC, endUTC) {
  try {
    const nonRecurrenceStatement = `
      SELECT title, content, startDateTime, endDateTime, recurrence FROM personalSchedule
      WHERE userId = :userID AND (
        recurrence = 0 AND ( 
          (startDateTime BETWEEN :start AND :end)
          OR
          (endDateTime BETWEEN :start AND :end)
          OR
          (startDateTime < :start AND endDateTime > :end)
        )
      )`;
    const recurrenceStatement = `
      SELECT * FROM personalSchedule
      WHERE userId = :userID AND (
        recurrence = 1 AND 
        startDateTime <= :end
      )`;
    const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
      replacements: { userID, start: startUTC, end: endUTC },
      type: Sequelize.QueryTypes.SELECT,
    });
    const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
      replacements: { userID, start: startUTC, end: endUTC },
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
    });
  } catch (err) {
    return next(err); 
  }
  return { nonRecurrenceSchedule, recurrenceSchedule };
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
    const schedule = getSchedule(start, end, startUTC, endUTC);
    return res.status(200).json(schedule);
  } catch (err) {
    return next(err);
  }
}

async function getUserPersonalDaySchedule(req, res, next) {
  try {
    const { user_id: userID } = req.params;
    const { date: dateString } = req.query;

    const start = moment.utc(dateString, 'YYYY-MM').startOf('month').toDate();
    const end = moment.utc(start).endOf('month').toDate();
    const startUTC = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const endUTC = new Date(end.getTime() + start.getTimezoneOffset() * 60000);
    const schedule = getSchedule(start, end, startUTC, endUTC);
    if (schedule) 
    return res.status(200).json(schedule);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getUserInfo,
  putUserSchedule,
  getUserPersonalMonthSchedule,
  getUserPersonalDaySchedule,
};
