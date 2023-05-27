const ApiError = require('../apiError');

class InvalidTokenError extends ApiError {
  constructor(message) {
    super(message || 'Invalid Token', 401);
  }
}

module.exports = InvalidTokenError;
