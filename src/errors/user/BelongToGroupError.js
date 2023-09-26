const ApiError = require('../apiError');

class BelongToGroupError extends ApiError {
  constructor(message) {
    super(message || '아직 가입중인 그룹이 있습니다.', 403);
  }
}

module.exports = BelongToGroupError;
