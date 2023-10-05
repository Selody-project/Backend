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
      let nonRecurrenceAttributes;
      let recurrenceAttributes;
      if (isSummary) {
        // title 및 content를 제외한 필드 목록
        nonRecurrenceAttributes = ['id', 'userId', 'startDateTime', 'endDateTime', 'recurrence'];
        // eslint-disable-next-line no-useless-escape
        recurrenceAttributes = ['id', 'userId', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      } else {
        // title 및 content를 포함한 필드 목록
        nonRecurrenceAttributes = ['id', 'userId', 'title', 'content', 'startDateTime', 'endDateTime', 'recurrence'];
        // eslint-disable-next-line no-useless-escape
        recurrenceAttributes = ['id', 'userId', 'title', 'content', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      }
      const nonRecurrenceStatement = `
        SELECT 
          ${nonRecurrenceAttributes.join(', ')},
          false AS isGroup
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userID.join(',')}) AND (
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
          ${recurrenceAttributes.join(', ')}, 
          false AS isGroup
        FROM 
          personalSchedule
        WHERE 
          userId IN (${userID.join(',')}) AND (
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
        const possibleDateList = [];
        scheduleDateList.forEach((scheduleDate) => {
          const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
          if (endDateTime >= start) {
            if (earliestDate > scheduleDate) {
              earliestDate = scheduleDate;
            }
            possibleDateList.push({ startDateTime: scheduleDate, endDateTime });
          }
        });
        if (possibleDateList.length !== 0) {
          if (isSummary) {
            recurrenceSchedule.push({
              id: schedule.id,
              userId: schedule.userId,
              recurrence: schedule.recurrence,
              freq: schedule.freq,
              interval: schedule.interval,
              byweekday: schedule.byweekday,
              startDateTime: schedule.startDateTime,
              endDateTime: schedule.endDateTime,
              until: schedule.until,
              isGroup: schedule.isGroup,
            });
          } else {
            recurrenceSchedule.push({
              id: schedule.id,
              userId: schedule.userId,
              title: schedule.title,
              content: schedule.content,
              recurrence: schedule.recurrence,
              freq: schedule.freq,
              interval: schedule.interval,
              byweekday: schedule.byweekday,
              startDateTime: schedule.startDateTime,
              endDateTime: schedule.endDateTime,
              until: schedule.until,
              isGroup: schedule.isGroup,
              recurrenceDateList: possibleDateList,
            });
          }
        }
      });
      if (earliestDate === Number.MAX_SAFE_INTEGER) {
        earliestDate = null;
      }
      return { earliestDate, nonRecurrenceSchedule, recurrenceSchedule };
    } catch (err) {
      throw new ApiError();
    }
  }
}

module.exports = PersonalSchedule;
