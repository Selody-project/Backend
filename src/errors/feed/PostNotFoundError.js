const ApiError = require('../apiError');

class PostNotFoundError extends ApiError {
  constructor(message) {
    super(message || '글을 찾을 수 없습니다.', 404);
  }
}

module.exports = PostNotFoundError;
