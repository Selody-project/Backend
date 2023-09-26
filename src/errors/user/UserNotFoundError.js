const ApiError = require('../apiError');

class UserNotFoundError extends ApiError {
  constructor(message) {
    super(message || '유저를 찾을 수 없습니다.', 404);
  }
}

module.exports = UserNotFoundError;
