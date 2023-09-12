const ApiError = require('../apiError');

class DuplicateLikeError extends ApiError {
  constructor(message) {
    super(message || 'This request has already been processed. ', 409);
  }
}

module.exports = DuplicateLikeError;
