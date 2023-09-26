const ApiError = require('../apiError');

class GroupNotFoundError extends ApiError {
  constructor(message) {
    super(message || '그룹을 찾을 수 없습니다.', 404);
  }
}

module.exports = GroupNotFoundError;
