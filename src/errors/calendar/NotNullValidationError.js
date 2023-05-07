const ApiError = require('../apiError');

class NotNullValidationError extends ApiError {
  constructor(message) {
    super(message || 'Not Null Validation', 400);
  }
}

module.exports = NotNullValidationError;
