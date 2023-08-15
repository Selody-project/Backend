const ApiError = require('../apiError');

class PostNotFoundError extends ApiError {
  constructor(message) {
    super(message || 'Post Not Found', 404);
  }
}

module.exports = PostNotFoundError;
