const ApiError = require('../apiError');

class UnauthroizedError extends ApiError {
  constructor(message) {
    super(message || 'Unauthorized access', 403);
  }
}

module.exports = UnauthroizedError;
