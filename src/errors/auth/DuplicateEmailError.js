const ApiError = require('../apiError');

class DuplicateEmailError extends ApiError {
  constructor(message) {
    super(message || '사용할 수 없는 이메일입니다. 다른 이메일을 입력해주세요.', 409);
  }
}

module.exports = DuplicateEmailError;
