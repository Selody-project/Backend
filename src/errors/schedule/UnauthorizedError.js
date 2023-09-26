const ApiError = require('../apiError');

class UnauthroizedError extends ApiError {
  constructor(message) {
    super(message || '접근 권한이 없습니다.', 403);
  }
}

module.exports = UnauthroizedError;
