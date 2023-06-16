const ApiError = require('../apiError');

class UserNotDeletedError extends ApiError {
  constructor(message) {
    super(message || 'User Is Not Deleted', 404);
  }
}

module.exports = UserNotDeletedError;
