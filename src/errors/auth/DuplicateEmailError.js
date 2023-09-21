const ApiError = require('../apiError');

class DuplicateEmailError extends ApiError {
  constructor(message) {
    super(message || 'Email Already exists', 409);
  }
}

module.exports = DuplicateEmailError;
