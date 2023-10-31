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
        type: Sequelize.DATE(3),
        allowNull: false,
      },
      endDateTime: {
        type: Sequelize.DATE(3),
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
        type: Sequelize.DATE(3),
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

  /*
    개인 일정 조회 (start ~ end 사이의 일정을 모두 조회)
    반복 일정은 해당 구간에서 몇 번의 반복이 일어나는지와 상관없이,
    DB에서는 단 하나의 레코드로 저장되어집니다.
    따라서 조회 시에는 반복 일정을 가져온 후, 해당 일정이 start ~ end 구간 내에서
    어떤 날짜에 얼마나 반복이 이루어지는 지를 알아낼 수 있어야 합니다.
    해당 기능을 구현하기 위해서 rrule(2.7.2 버전) 패키지를 사용하였습니다.
  */
  static async getSchedule(userID, start, end, isSummary = false) {
    try {
      const db = require('.');

      // 조회된 모든 일정 중에서 가장 빠른 시간을 알아내기 위해 ( 요약된 일정 조회인 경우에만 계산 )
      let earliestDate = Number.MAX_SAFE_INTEGER;

      const userIds = userID.join(',');
      let attributes;

      // (title, content가 제외된) 요약된 정보만을 조회하고 싶은 경우
      if (isSummary) {
        // eslint-disable-next-line no-useless-escape
        attributes = ['id', 'userId', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      } else {
        // eslint-disable-next-line no-useless-escape
        attributes = ['id', 'userId', 'title', 'content', 'startDateTime', 'endDateTime', 'recurrence', 'freq', '\`interval\`', 'byweekday', 'until'];
      }

      // 반복이 없는 일정 쿼리
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
      // 반복 일정 쿼리
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
      // nonRecurrence 쿼리 실행
      const nonRecurrenceSchedule = await db.sequelize.query(nonRecurrenceStatement, {
        replacements: {
          start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
          end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
        },
        type: Sequelize.QueryTypes.SELECT,
      });
      // recurrence 쿼리 실행
      const recurrenceScheduleList = await db.sequelize.query(recurrenceStatement, {
        replacements: {
          start: moment.utc(start).format('YYYY-MM-DDTHH:mm:ssZ'),
          end: moment.utc(end).format('YYYY-MM-DDTHH:mm:ssZ'),
        },
        type: Sequelize.QueryTypes.SELECT,
      });

      // 반복 일정의 경우 조회된 모든 반복 일정 레코드를 순회하면서
      // 해당 구간의 어느 지점에서 일정이 반복되는지를 알아냄
      const recurrenceSchedule = [];
      recurrenceScheduleList.forEach((schedule) => {
        // RRule 객체 설정
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

        // 일정의 길이를 계산
        const scheduleLength = (new Date(schedule.endDateTime) - new Date(schedule.startDateTime));

        // rrule.between을 사용하여, 모든 반복 일자를 뽑아냄
        const scheduleDateList = rrule.between(
          new Date(start.getTime() - scheduleLength),
          new Date(end.getTime() + 1),
        );

        // start ~ end 구간에서 반복되는 일정인 경우에만
        if (scheduleDateList.length !== 0) {
          // 요약 조회인 경우
          if (isSummary) {
            const scheduleDate = scheduleDateList[0];
            const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
            // endDateTime이 start보다 크거나 같으면 start ~ end 구간에 포함되는 일정이므로
            if (endDateTime >= start) {
              // earliestDate를 업데이트
              if (earliestDate > scheduleDate) {
                earliestDate = scheduleDate;
              }
              recurrenceSchedule.push({
                id: schedule.id,
                userId: schedule.userId,
                startDateTime: schedule.startDateTime,
                endDateTime: schedule.endDateTime,
                recurrence: schedule.recurrence,
                freq: schedule.freq,
                interval: schedule.interval,
                byweekday: schedule.byweekday,
                isGroup: schedule.isGroup,
                startRecur: schedule.startDateTime,
                endRecur: schedule.until,
              });
            }
          } else {
            // 요약 조회가 아닌 경우
            scheduleDateList.forEach((scheduleDate) => {
              const endDateTime = new Date(scheduleDate.getTime() + scheduleLength);
              // endDateTime이 start보다 크면 start ~ end 구간에 포함되는 일정이므로
              if (endDateTime >= start) {
                recurrenceSchedule.push({
                  id: schedule.id,
                  userId: schedule.userId,
                  title: schedule.title,
                  content: schedule.content,
                  startDateTime: scheduleDate,
                  endDateTime,
                  recurrence: schedule.recurrence,
                  freq: schedule.freq,
                  interval: schedule.interval,
                  byweekday: schedule.byweekday,
                  isGroup: schedule.isGroup,
                  startRecur: schedule.startDateTime,
                  endRecur: schedule.until,
                });
              }
            });
          }
        }
      });

      // 미반복 일정과 반복 일정 조회 결과를 합쳐줌
      const schedules = [...nonRecurrenceSchedule, ...recurrenceSchedule];

      // 요약 조회의 경우 earliestDate를 계산해야 하므로 아래의 과정을 거쳐줍니다.
      if (isSummary) {
        nonRecurrenceSchedule.forEach((schedule) => {
          const scheduleDate = new Date(schedule.startDateTime);
          if (earliestDate > scheduleDate) {
            earliestDate = scheduleDate;
          }
        });
        if (earliestDate === Number.MAX_SAFE_INTEGER) {
          earliestDate = null;
        }
        return { earliestDate, schedules };
      }
      return { schedules };
    } catch (err) {
      throw new ApiError();
    }
  }

  /*
    해당 메소드는 일정 후보 추천 기능에서만 사용되는 메소드 입니다.
    위의 getSchedule과 거의 모든 기능이 동일하지만, 불필요한 과정을 좀 덜어낸 상태입니다.
    전체적인 흐름은 getSchedule과 동일하므로 해당 메소드를 참고해주시면 됩니다.
  */
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
