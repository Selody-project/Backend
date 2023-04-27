const ApiError = require('../apiError');

class DuplicateUserError extends ApiError {
  constructor(message) {
    super(message || 'User Already exists', 409);
  }
}

module.exports = DuplicateUserError;
