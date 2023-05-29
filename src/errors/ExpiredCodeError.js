const ApiError = require('./apiError');

class ExpiredCodeError extends ApiError {
  constructor(message) {
    super(message || 'Expired invitation code.', 410);
  }
}

module.exports = ExpiredCodeError;