const ApiError = require('../apiError');

class InvalidPasswordError extends ApiError {
  constructor(message) {
    super(message || '현재 비밀번호가 잘못되었습니다. ', 401);
  }
}

module.exports = InvalidPasswordError;
