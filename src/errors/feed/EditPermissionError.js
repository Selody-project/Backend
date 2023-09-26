const ApiError = require('../apiError');

class EditPermissionError extends ApiError {
  constructor(message) {
    super(message || '수정할 권한이 없습니다.', 403);
  }
}

module.exports = EditPermissionError;
