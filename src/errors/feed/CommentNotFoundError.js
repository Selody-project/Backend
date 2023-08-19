const ApiError = require('../apiError');

class CommentNotFoundError extends ApiError {
  constructor(message) {
    super(message || 'Comment Not Found', 404);
  }
}

module.exports = CommentNotFoundError;
