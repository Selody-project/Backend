const InvalidIdPasswordError = require('./InvalidIdPasswordError');
const InvalidPasswordError = require('./InvalidPasswordError');
const DuplicateUserError = require('./DuplicateUserError');
const DuplicateEmailError = require('./DuplicateEmailError');
const DuplicateNicknameError = require('./DuplicateNicknameError');
const InvalidTokenError = require('./InvalidTokenError');
const TokenExpireError = require('./TokenExpireError');

module.exports = {
  InvalidIdPasswordError,
  InvalidPasswordError,
  DuplicateUserError,
  DuplicateEmailError,
  DuplicateNicknameError,
  InvalidTokenError,
  TokenExpireError,
};
