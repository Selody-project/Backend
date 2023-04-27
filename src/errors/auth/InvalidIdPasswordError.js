const ApiError = require('../apiError');

class InvalidIdPasswordError extends ApiError {
  constructor(message) {
    super(message || 'Invalid User ID/Password', 401);
  }
}

module.exports = InvalidIdPasswordError;
