const ApiError = require('../apiError');

class TokenExpireError extends ApiError {
  constructor(message) {
    super(message || '만료된 토큰입니다.', 401);
  }
}

module.exports = TokenExpireError;
