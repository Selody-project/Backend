"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRRuleFreq = exports.getRRuleByWeekDay = void 0;
var rrule_1 = require("rrule");
function getRRuleFreq(freq) {
    var RRuleFreq = {
        DAILY: rrule_1.RRule.DAILY,
        WEEKLY: rrule_1.RRule.WEEKLY,
        MONTHLY: rrule_1.RRule.MONTHLY,
        YEARLY: rrule_1.RRule.YEARLY,
    };
    return RRuleFreq[freq];
}
exports.getRRuleFreq = getRRuleFreq;
function getRRuleByWeekDay(byweekday) {
    if (!byweekday) {
        return [];
    }
    var arr = byweekday.split(',');
    var RRuleWeekDay = {
        MO: rrule_1.RRule.MO,
        TU: rrule_1.RRule.TU,
        WE: rrule_1.RRule.WE,
        TH: rrule_1.RRule.TH,
        FR: rrule_1.RRule.FR,
        SA: rrule_1.RRule.SA,
        SU: rrule_1.RRule.SU,
    };
    if (arr[0] === '') {
        return [];
    }
    return arr.map(function (str) { return RRuleWeekDay[str]; });
}
exports.getRRuleByWeekDay = getRRuleByWeekDay;
