/* eslint-disable newline-per-chained-call */
const Joi = require('joi').extend(require('@joi/date'));

const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

const userSchema = Joi.object({
  email: Joi.string().email(),
  nickname: Joi.string().max(30),
});

const groupScehma = Joi.object({
  group_id: Joi.number().min(0).required(),
});

module.exports = {
  validateUserSchema: validator(userSchema),
  validateGroupSchema: validator(groupScehma),
};
