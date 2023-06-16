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

module.exports = {
  getRRuleByWeekDay,
  getRRuleFreq,
};
