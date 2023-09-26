const ApiError = require('../apiError');

class DuplicateNicknameError extends ApiError {
  constructor(message) {
    super(message || '사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요.', 409);
  }
}

module.exports = DuplicateNicknameError;
