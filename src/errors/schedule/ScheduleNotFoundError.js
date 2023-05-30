const ApiError = require('../apiError');

class UnathroizedError extends ApiError {
  constructor(message) {
    super(message || 'Schedule Not Found', 403);
  }
}

module.exports = UnathroizedError;
