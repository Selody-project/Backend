const ApiError = require('../apiError');

class InvalidGroupJoinError extends ApiError {
  constructor(message) {
    super(message || '이미 가입된 그룹입니다.', 403);
  }
}

module.exports = InvalidGroupJoinError;
