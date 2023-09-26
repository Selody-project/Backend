const ApiError = require('../apiError');

class ExpiredCodeError extends ApiError {
  constructor(message) {
    super(message || '만료된 초대 링크입니다.', 410);
  }
}

module.exports = ExpiredCodeError;
