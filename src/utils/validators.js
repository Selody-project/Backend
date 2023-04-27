/* eslint-disable newline-per-chained-call */
const Joi = require('joi').extend(require('@joi/date'));

// Request path/body validator
const validator = (schema) => (payload) => schema.validate(payload, { abortEarly: false });

// Category Body validator
const userSchema = Joi.object({
  email: Joi.string().email(),
  nickname: Joi.string().max(30),
});

module.exports = {
  validateCategoryBody: validator(userSchema),
};
