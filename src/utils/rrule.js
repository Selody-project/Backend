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
    0: RRule.SU,
    1: RRule.MO,
    2: RRule.TU,
    3: RRule.WE,
    4: RRule.TH,
    5: RRule.FR,
    6: RRule.SA,
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
    scheduleSummary: {},
    todaySchedules: [],
    schedulesForTheWeek: [],
  };
  // 일반 일정인 경우
  if (schedule.recurrence === 0) {
    response.scheduleSummary = { ...schedule };
    delete response.scheduleSummary.title;
    delete response.scheduleSummary.content;
    if (requestStart < new Date(startDateTime.getTime() + scheduleLength)) {
      if (startDateTime < requestEnd) {
        // 오늘 일정
        response.todaySchedules.push({ ...schedule });
      } else if (startDateTime < sixDaysLater) {
        // 일주일 이내 일정
        response.schedulesForTheWeek.push({ ...schedule });
      }
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
    schedule.startRecur = schedule.startDateTime;
    schedule.endRecur = schedule.until;
    delete schedule.until;
    response.scheduleSummary = { ...schedule };
    delete response.scheduleSummary.title;
    delete response.scheduleSummary.content;
    if (scheduleStartTimeList.length !== 0) {
      scheduleStartTimeList.forEach((scheduleStartTime) => {
        const scheduleEndTime = new Date(scheduleStartTime.getTime() + scheduleLength);
        if (scheduleEndTime >= requestStart) {
          schedule.startDateTime = scheduleStartTime;
          schedule.endDateTime = scheduleEndTime;
          if (scheduleStartTime < requestEnd) {
            // 오늘 일정
            response.todaySchedules.push({ ...schedule });
          } else if (scheduleStartTime < sixDaysLater) {
            // 일주일 이내 일정
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
