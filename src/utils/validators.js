/* eslint-disable newline-per-chained-call */
const Joi = require('joi').extend(require('@joi/date'));

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

const joinSchema = Joi.object({
  userId: Joi.number(), // 테스트에서 primary key 값을 1로 고정하기 위해 필요
  email: Joi.string().email(),
  nickname: Joi.string().max(15),
  password: Joi.string().min(10).max(100),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().max(100).required(),
})

const userIdSchema = Joi.object({
  user_id: Joi.number().min(0).required(),
});

const groupSchema = Joi.object({
  groupId: Joi.number().min(0),
  name: Joi.string().max(45).required(),
  memeber: Joi.number().min(1),
});

const groupIdSchema = Joi.object({
  group_id: Joi.number().min(0).required(),
});

const scheduleSchema = Joi.object({
  id: Joi.number().min(0),

});

const scheduleIdSchema = Joi.object({
  id: Joi.number().min(0).required(),
})

module.exports = {
  validateLoginSchema: validator(loginSchema),
  validateJoinSchema: validator(joinSchema),
  validateUserIdSchema: validator(userIdSchema),
  validateGroupSchema: validator(groupSchema),
  validateGroupIdSchema: validator(groupIdSchema),
  validateScheduleSchema: validator(scheduleSchema),
  validateScheduleIdSchema: validator(scheduleIdSchema),
};
