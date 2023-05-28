const ApiError = require('../apiError');

class TokenExpireError extends ApiError {
  constructor(message) {
    super(message || 'Expired Token', 401);
  }
}

module.exports = TokenExpireError;
