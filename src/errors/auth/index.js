const InvalidIdPasswordError = require('./InvalidIdPasswordError');
const DuplicateUserError = require('./DuplicateUserError');
const DuplicateEmailError = require('./DuplicateEmailError');
const DuplicateNicknameError = require('./DuplicateNicknameError');
const InvalidTokenError = require('./InvalidTokenError');
const TokenExpireError = require('./TokenExpireError');

module.exports = {
  InvalidIdPasswordError,
  DuplicateUserError,
  DuplicateEmailError,
  DuplicateNicknameError,
  InvalidTokenError,
  TokenExpireError,
};
