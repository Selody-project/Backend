/* eslint-disable newline-per-chained-call */
const Joi = require('joi').extend(require('@joi/date'));

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

const joinSchema = Joi.object({
  userId: Joi.number(),
  email: Joi.string().email(),
  nickname: Joi.string().max(15),
  password: Joi.string().min(10).max(100),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().max(100).required(),
});

const userIdSchema = Joi.object({
  user_id: Joi.number().min(0).required(),
});

const yearMonthScehma = Joi.object({
  date: Joi.date().format('YYYY-MM'),
});

const yearMonthDayScehma = Joi.object({
  date: Joi.date().format('YYYY-MM-DD'),
});

const groupSchema = Joi.object({
  groupId: Joi.number().min(0),
  name: Joi.string().max(45),
  memeber: Joi.number().min(1),
  inviteCode: Joi.string(),
  inviteExp: Joi.date(),
});

const groupIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
});

const scheduleDateScehma = Joi.object({
  startDateTime: Joi.date(),
  endDateTime: Joi.date(),
});

const scheduleSchema = Joi.object({
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

const groupScheduleSchema = Joi.object({
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

const userScheduleSchema = Joi.object({
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

const scheduleIdSchema = Joi.object({
  id: Joi.number().min(0).required(),
});

module.exports = {
  validateLoginSchema: validator(loginSchema),
  validateJoinSchema: validator(joinSchema),
  validateUserIdSchema: validator(userIdSchema),
  validateGroupSchema: validator(groupSchema),
  validateGroupIdSchema: validator(groupIdSchema),
  validateScheduleSchema: validator(scheduleSchema),
  validateScheduleIdSchema: validator(scheduleIdSchema),
  validateGroupScheduleSchema: validator(groupScheduleSchema),
  validateScheduleDateScehma: validator(scheduleDateScehma),
  validateUserScheduleSchema: validator(userScheduleSchema),
  validateYYYYMMDateSchema: validator(yearMonthScehma),
  validateYYYYMMDDDateSchema: validator(yearMonthDayScehma),
};
