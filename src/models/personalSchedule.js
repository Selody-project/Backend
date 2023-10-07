const Sequelize = require('sequelize');
const { RRule } = require('rrule');
const moment = require('moment');
const { getRRuleByWeekDay, getRRuleFreq } = require('../utils/rrule');
const ApiError = require('../errors/apiError');

class PersonalSchedule extends Sequelize.Model {
  static initiate(sequelize) {
    PersonalSchedule.init({
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startDateTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDateTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      recurrence: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
      },
      freq: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      byweekday: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'PersonalSchedule',
      tableName: 'personalSchedule',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.PersonalSchedule.belongsTo(db.User, {
      foreignKey: 'userId',
    });
  }

  static async getSchedule(userID, start, end, isSummary = false) {
    try {
      const db = require('.');
      let earliestDate = Number.MAX_SAFE_INTEGER;
      const userIds = userID.join(',');
      let attributes;
      if (isSummary) {
        // eslint-disable-next-line no-useless-escape
        attributes = ['id', 'userId', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      } else {
        // eslint-disable-next-line no-useless-escape
        attributes = ['id', 'userId', 'title', 'content', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      }
      const nonRecurrenceStatement = `
        SELECT 
          ${attributes.join(', ')},
          false AS isGroup
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userIds}) AND (
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
          ${attributes.join(', ')}, 
          false AS isGroup
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userIds}) AND (
          recurrence = 1 AND 
          startDateTime <= :end
        )`;
      const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
        replacements: {
          start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
          end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
        },
        type: Sequelize.QueryTypes.SELECT,
      });
      nonRecurrenceSchedule.forEach((schedule) => {
        const scheduleDate = new Date(schedule.startDateTime);
        if (earliestDate > scheduleDate) {
          earliestDate = scheduleDate;
        }
      });
      const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
        replacements: {
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
        if (scheduleDateList.length !== 0) {
          const scheduleDate = scheduleDateList[0];
          const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
          if (endDateTime >= start) {
            if (earliestDate > scheduleDate) {
              earliestDate = scheduleDate;
            }
            if (isSummary) {
              recurrenceSchedule.push({
                id: schedule.id,
                userId: schedule.userId,
                startDateTime: schedule.startDateTime,
                endDatetime: schedule.endDateTime,
                recurrence: schedule.recurrence,
                freq: schedule.freq,
                interval: schedule.interval,
                byweekday: schedule.byweekday,
                isGroup: schedule.isGroup,
                startRecur: schedule.startDateTime,
                endRecur: schedule.until,
              });
            } else {
              recurrenceSchedule.push({
                id: schedule.id,
                userId: schedule.userId,
                title: schedule.title,
                content: schedule.content,
                startDateTime: schedule.startDateTime,
                endDatetime: schedule.endDateTime,
                recurrence: schedule.recurrence,
                freq: schedule.freq,
                interval: schedule.interval,
                byweekday: schedule.byweekday,
                isGroup: schedule.isGroup,
                startRecur: schedule.startDateTime,
                endRecur: schedule.until,
              });
            }
          }
        }
      });
      if (earliestDate === Number.MAX_SAFE_INTEGER) {
        earliestDate = null;
      }
      const schedules = [...nonRecurrenceSchedule, ...recurrenceSchedule];
      return { earliestDate, schedules };
    } catch (err) {
      throw new ApiError();
    }
  }

  static async getProposalSchedule(userID, start, end) {
    try {
      const db = require('.');
      const userIds = userID.join(',');
      const nonRecurrenceAttributes = ['startDateTime', 'endDateTime'];
      // eslint-disable-next-line no-useless-escape
      const recurrenceAttributes = ['startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      const nonRecurrenceStatement = `
        SELECT 
          ${nonRecurrenceAttributes.join(', ')}
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userIds}) AND (
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
          ${recurrenceAttributes.join(', ')}
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userIds}) AND (
          recurrence = 1 AND 
          startDateTime <= :end
        )`;
      const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
        replacements: {
          start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
          end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
        },
        type: Sequelize.QueryTypes.SELECT,
      });
      const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
        replacements: {
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
        scheduleDateList.forEach((scheduleDate) => {
          const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
          if (endDateTime >= start) {
            recurrenceSchedule.push({ startDateTime: scheduleDate, endDateTime });
          }
        });
      });
      const result = [...nonRecurrenceSchedule, ...recurrenceSchedule];
      return result;
    } catch (err) {
      throw new ApiError();
    }
  }
}

module.exports = PersonalSchedule;
