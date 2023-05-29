const ApiError = require('../apiError');

class NotFoundError extends ApiError {
  constructor(message) {
    super(message || 'Not Found data', 404);
  }
}

module.exports = NotFoundError;
