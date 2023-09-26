const ApiError = require('../apiError');

class DuplicateUserError extends ApiError {
  constructor(message) {
    super(message || '이미 사용중인 이메일/닉네임 입니다.', 409);
  }
}

module.exports = DuplicateUserError;
