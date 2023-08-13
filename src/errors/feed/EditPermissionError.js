const ApiError = require('../apiError');

class EditPermissionError extends ApiError {
  constructor(message) {
    super(message || 'You do not have permission to modify the post.', 403);
  }
}

module.exports = EditPermissionError;
