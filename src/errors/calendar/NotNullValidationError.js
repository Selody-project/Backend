const ApiError = require('../apiError');

class NotNullValidationError extends ApiError {
  constructor(message) {
    super(message || '값이 존재해야 합니다.', 400);
  }
}

module.exports = NotNullValidationError;
