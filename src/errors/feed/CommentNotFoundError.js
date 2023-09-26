const ApiError = require('../apiError');

class CommentNotFoundError extends ApiError {
  constructor(message) {
    super(message || '댓글을 찾을 수 없습니다.', 404);
  }
}

module.exports = CommentNotFoundError;
