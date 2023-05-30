const ApiError = require('./apiError');

class InvalidGroupJoinError extends ApiError {
  constructor(message) {
    super(message || 'You are already a member of this group.', 403);
  }
}

module.exports = InvalidGroupJoinError;
