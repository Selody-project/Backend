import { Frequency, RRule, Weekday } from "rrule";

function getRRuleFreq(freq: Frequency) {
  const RRuleFreq: { [key: string]: Frequency } = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  };

  return RRuleFreq[freq];
}

function getRRuleByWeekDay(byweekday: string): Weekday[] {
  if (!byweekday) {
    return [];
  }
  const arr = byweekday.split(',');
  const RRuleWeekDay: { [key: string]: Weekday } = {
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

exports = {
  getRRuleByWeekDay,
  getRRuleFreq,
};
