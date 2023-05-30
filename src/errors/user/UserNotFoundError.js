const ApiError = require('../apiError');

class UserNotFoundError extends ApiError {
  constructor(message) {
    super(message || 'User Not Found', 404);
  }
}

module.exports = UserNotFoundError;
