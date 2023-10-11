/* eslint-disable newline-per-chained-call */
const Joi = require('joi').extend(require('@joi/date'));
const moment = require('moment');

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

const joinSchema = Joi.object({
  userId: Joi.number(),
  email: Joi.string().email().min(0).max(40),
  nickname: Joi.string().min(0).max(15),
  password: Joi.string().min(10).max(100),
}).or('email', 'nickname');

const profileSchema = Joi.object({
  email: Joi.string().email().min(1).max(40).required(),
  nickname: Joi.string().min(1).max(15).required(),
  introduction: Joi.string().max(50).required(),
});

const passwordSchema = Joi.object({
  currentPassword: Joi.string().max(100).required(),
  newPassword: Joi.string().min(10).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().min(1).max(40).required(),
  password: Joi.string().min(1).max(100).required(),
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
  name: Joi.string().min(1).max(45).required(),
  description: Joi.string().max(300),
});

const groupIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
});

const scheduleDateSchema = Joi.object({
  startDateTime: Joi.date().required(),
  endDateTime: Joi.date().required(),
});

const getCurrentTime = () => {
  const testEnv = process.env.NODE_ENV === 'test';
  return testEnv ? new Date('1900-01-01T00:00:00.000Z') : moment().utc().subtract(6, 'months');
};

const scheduleSchema = Joi.object({
  requestStartDateTime: Joi.date().required(),
  requestEndDateTime: Joi.date().required(),
  title: Joi.string().max(45).required(),
  content: Joi.string(),
  startDateTime: Joi.date().min(getCurrentTime()).required(),
  endDateTime: Joi.date().required(),
  recurrence: Joi.valid(0, 1).required(),
  freq: Joi.when('recurrence', {
    is: 0,
    then: Joi.valid(null).required(),
    otherwise: Joi.string().valid('WEEKLY', 'DAILY', 'MONTHLY', 'YEARLY').required(),
  }),
  interval: Joi.when('recurrence', {
    is: 0,
    then: Joi.valid(null).required(),
    otherwise: Joi.number().required(),
  }),
  byweekday: Joi.when('freq', {
    is: 'WEEKLY',
    then: Joi.array().items(Joi.string().min(0)).required(),
    otherwise: Joi.valid(null).required(),
  }),
  until: Joi.when('recurrence', {
    is: 0,
    then: Joi.valid(null).required(),
    otherwise: Joi.date().required(),
  }),
});

const scheduleIdSchema = Joi.object({
  schedule_id: Joi.number().min(0).required(),
});

const groupScheduleIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
  schedule_id: Joi.number().min(0).required(),
});

const eventPoroposalSchema = Joi.object({
  date1: Joi.date().min(getCurrentTime()).required(),
  date2: Joi.date().min(getCurrentTime()),
  date3: Joi.date().min(getCurrentTime()),
});

const postSchema = Joi.object({
  title: Joi.string().max(45).required(),
  content: Joi.string().max(1000).required(),
});

const postIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
  post_id: Joi.number().min(0).required(),
});

const lastRecordIdSchema = Joi.object({
  last_record_id: Joi.number().min(0).required(),
});

const commentSchema = Joi.object({
  content: Joi.string().max(250).required(),
});

const commentIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
  post_id: Joi.number().min(0).required(),
  comment_id: Joi.number().min(0).required(),
});

const groupJoinInviteCodeSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
  inviteCode: Joi.string().min(0).required(),
});

const groupInviteCodeSchema = Joi.object({
  inviteCode: Joi.string().min(0).required(),
});

const groupJoinRequestSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
  user_id: Joi.number().min(0).required(),
});

const groupSearchKeywordSchema = Joi.object({
  keyword: Joi.string().min(2).max(45).required(),
  last_record_id: Joi.number().min(0).required(),
});

const userSettingSchema = Joi.object({
  shareScheduleOption: Joi.number(),
  notificationOption: Joi.number(),
}).or('shareScheduleOption', 'notificationOption');

const userIntroductionSchema = Joi.object({
  introduction: Joi.string().max(50).required(),
});

module.exports = {
  validateLoginSchema: validator(loginSchema),
  validateJoinSchema: validator(joinSchema),
  validateProfileSchema: validator(profileSchema),
  validatePasswordSchema: validator(passwordSchema),
  validateUserIdSchema: validator(userIdSchema),
  validateGroupSchema: validator(groupSchema),
  validateGroupIdSchema: validator(groupIdSchema),
  validateScheduleSchema: validator(scheduleSchema),
  validateScheduleIdSchema: validator(scheduleIdSchema),
  validateGroupScheduleIdSchema: validator(groupScheduleIdSchema),
  validateScheduleDateSchema: validator(scheduleDateSchema),
  validateYYYYMMDateSchema: validator(yearMonthScehma),
  validateYYYYMMDDDateSchema: validator(yearMonthDayScehma),
  validateEventProposalSchema: validator(eventPoroposalSchema),
  validatePostSchema: validator(postSchema),
  validatePostIdSchema: validator(postIdSchema),
  validateLastRecordIdSchema: validator(lastRecordIdSchema),
  validateCommentSchema: validator(commentSchema),
  validateCommentIdSchema: validator(commentIdSchema),
  validateGroupJoinInviteCodeSchema: validator(groupJoinInviteCodeSchema),
  validateGroupInviteCodeSchema: validator(groupInviteCodeSchema),
  validateGroupJoinRequestSchema: validator(groupJoinRequestSchema),
  validateGroupdSearchKeyword: validator(groupSearchKeywordSchema),
  validateUserSettingSchema: validator(userSettingSchema),
  validateUserIntroductionSchema: validator(userIntroductionSchema),
};
