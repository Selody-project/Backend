"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateYYYYMMDDDateSchema = exports.validateYYYYMMDateSchema = exports.validateUserScheduleSchema = exports.validateScheduleDateScehma = exports.validateGroupScheduleSchema = exports.validateScheduleIdSchema = exports.validateScheduleSchema = exports.validateGroupIdSchema = exports.validateGroupSchema = exports.validateUserIdSchema = exports.validateJoinSchema = exports.validateLoginSchema = void 0;
var JoiBase = require("joi");
var date_1 = require("@joi/date");
var Joi = JoiBase.extend(date_1.default);
// eslint-disable-next-line max-len
var validator = function (schema) { return function (payload) { return schema.validate(payload, { abortEarly: false }); }; };
var joinSchema = Joi.object({
    userId: Joi.number(),
    email: Joi.string().email(),
    nickname: Joi.string().max(15),
    password: Joi.string().min(10).max(100),
});
var loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(100).required(),
});
var userIdSchema = Joi.object({
    user_id: Joi.number().min(0).required(),
});
var yearMonthSchema = Joi.object({
    date: Joi.date().format('YYYY-MM'),
});
var yearMonthDaySchema = Joi.object({
    date: Joi.date().format('YYYY-MM-DD'),
});
var groupSchema = Joi.object({
    groupId: Joi.number().min(0),
    name: Joi.string().max(45),
    memeber: Joi.number().min(1),
    inviteCode: Joi.string(),
    inviteExp: Joi.date(),
});
var groupIdSchema = Joi.object({
    group_id: Joi.number().min(0).required(),
});
var scheduleDateSchema = Joi.object({
    startDateTime: Joi.date(),
    endDateTime: Joi.date(),
});
var scheduleSchema = Joi.object({
    id: Joi.number().min(0),
    title: Joi.string().max(45),
    content: Joi.string(),
    startDateTime: Joi.date(),
    endDateTime: Joi.date(),
    recurrence: Joi.number(),
    freq: Joi.string().max(10),
    interval: Joi.number(),
    byweekday: Joi.string(),
    until: Joi.date(),
    confirmed: Joi.number(),
    possible: Joi.object(),
    impossible: Joi.object(),
});
var groupScheduleSchema = Joi.object({
    groupId: Joi.number().required(),
    title: Joi.string().max(45).required(),
    content: Joi.string(),
    startDateTime: Joi.date(),
    endDateTime: Joi.date(),
    recurrence: Joi.number(),
    freq: Joi.string().max(10),
    interval: Joi.number(),
    byweekday: Joi.string(),
    until: Joi.date(),
});
var userScheduleSchema = Joi.object({
    userId: Joi.number(),
    title: Joi.string().max(45).required(),
    content: Joi.string(),
    startDateTime: Joi.date(),
    endDateTime: Joi.date(),
    recurrence: Joi.number(),
    freq: Joi.string().max(10),
    interval: Joi.number(),
    byweekday: Joi.string(),
    until: Joi.date(),
});
var scheduleIdSchema = Joi.object({
    id: Joi.number().min(0).required(),
});
var validateLoginSchema = validator(loginSchema);
exports.validateLoginSchema = validateLoginSchema;
var validateJoinSchema = validator(joinSchema);
exports.validateJoinSchema = validateJoinSchema;
var validateUserIdSchema = validator(userIdSchema);
exports.validateUserIdSchema = validateUserIdSchema;
var validateGroupSchema = validator(groupSchema);
exports.validateGroupSchema = validateGroupSchema;
var validateGroupIdSchema = validator(groupIdSchema);
exports.validateGroupIdSchema = validateGroupIdSchema;
var validateScheduleSchema = validator(scheduleSchema);
exports.validateScheduleSchema = validateScheduleSchema;
var validateScheduleIdSchema = validator(scheduleIdSchema);
exports.validateScheduleIdSchema = validateScheduleIdSchema;
var validateGroupScheduleSchema = validator(groupScheduleSchema);
exports.validateGroupScheduleSchema = validateGroupScheduleSchema;
var validateScheduleDateScehma = validator(scheduleDateSchema);
exports.validateScheduleDateScehma = validateScheduleDateScehma;
var validateUserScheduleSchema = validator(userScheduleSchema);
exports.validateUserScheduleSchema = validateUserScheduleSchema;
var validateYYYYMMDateSchema = validator(yearMonthSchema);
exports.validateYYYYMMDateSchema = validateYYYYMMDateSchema;
var validateYYYYMMDDDateSchema = validator(yearMonthDaySchema);
exports.validateYYYYMMDDDateSchema = validateYYYYMMDDDateSchema;
