const ApiError = require('../apiError');

class ExceedGroupCountError extends ApiError {
  constructor(message) {
    super(message || '그룹 가입/요청 수가 제한을 초과했습니다.(최대 50개)', 403);
  }
}

module.exports = ExceedGroupCountError;
