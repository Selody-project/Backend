const ApiError = require('../apiError');

class DuplicateLikeError extends ApiError {
  constructor(message) {
    super(message || '이미 전달된 요청입니다. ', 409);
  }
}

module.exports = DuplicateLikeError;
