const ApiError = require('../apiError');

class InvalidIdPasswordError extends ApiError {
  constructor(message) {
    super(message || '사용자 ID 또는 비밀번호가 잘못되었습니다. ', 401);
  }
}

module.exports = InvalidIdPasswordError;
