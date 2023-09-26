const ApiError = require('../apiError');

class InvalidTokenError extends ApiError {
  constructor(message) {
    super(message || '잘못된 토큰입니다.', 401);
  }
}

module.exports = InvalidTokenError;
