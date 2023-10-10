const moment = require('moment');
const {
  RRule,
} = require('rrule');

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
  if (!byweekday) {
    return [];
  }
  const arr = byweekday;
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

async function getScheduleResponse(requestStartDateTime, requestEndDateTime, scheduleData, isGroup = false) {
  const schedule = { ...scheduleData };
  const requestStart = moment.utc(requestStartDateTime).toDate();
  const requestEnd = moment.utc(requestEndDateTime).toDate();
  const sixDaysLater = moment.utc(requestEndDateTime).add(6, 'days').toDate();
  const startDateTime = moment.utc(schedule.startDateTime).toDate();
  const endDateTime = moment.utc(schedule.endDateTime).toDate();
  const scheduleLength = (endDateTime.getTime() - startDateTime.getTime());
  if (isGroup) {
    schedule.isGroup = 1;
  } else {
    schedule.isGroup = 0;
  }
  const response = {
    scheduleSummary: { ...schedule },
    todaySchedule: [],
    schedulesForTheWeek: [],
  };
  delete response.scheduleSummary.title;
  delete response.scheduleSummary.content;
  // 일반 일정인 경우
  if (schedule.recurrence === 0 && requestStart < new Date(startDateTime.getTime() + scheduleLength)) {
    // 일주일 이내 일정
    if (startDateTime < sixDaysLater) {
      response.schedulesForTheWeek.push({ ...schedule });
    }

    // 오늘 일정
    if (startDateTime < requestEnd) {
      response.todaySchedule.push({ ...schedule });
    }
  } else { // 반복 일정인 경우
    // rrule 객체 생성
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
    // rrule 객체를 이용해서 특정 구간에서 해당 일정의 모든 startDateTime을 추출
    // 여기서는 (requestStart - 일정 길이) ~ requestEnd로부터
    const scheduleStartTimeList = rrule.between(
      new Date(requestStart.getTime() - scheduleLength),
      new Date(sixDaysLater.getTime() + 1),
    );
    if (scheduleStartTimeList.length !== 0) {
      scheduleStartTimeList.forEach((scheduleStartTime) => {
        const scheduleEndTime = new Date(scheduleStartTime.getTime() + scheduleLength);
        if (scheduleEndTime >= requestStart) {
          schedule.startDateTime = scheduleStartTime;
          schedule.endDateTime = scheduleEndTime;
          console.log(schedule);
          // 오늘 일정
          if (scheduleStartTime < requestEnd) {
            response.todaySchedule.push({ ...schedule });
          }

          // 일주일 이내 일정
          if (scheduleStartTime < sixDaysLater) {
            response.schedulesForTheWeek.push({ ...schedule });
          }
        }
      });
    }
  }
  return response;
}

module.exports = {
  getRRuleByWeekDay,
  getRRuleFreq,
  getScheduleResponse,
};
