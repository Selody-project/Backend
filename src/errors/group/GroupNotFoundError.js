const ApiError = require('../apiError');

class GroupNotFoundError extends ApiError {
  constructor(message) {
    super(message || 'Group Not Found', 404);
  }
}

module.exports = GroupNotFoundError;
