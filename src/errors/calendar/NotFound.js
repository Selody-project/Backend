const ApiError = require('../apiError');

class NotFoundError extends ApiError {
  constructor(message) {
    super(message || '데이터를 찾을 수 없습니다.', 404);
  }
}

module.exports = NotFoundError;
