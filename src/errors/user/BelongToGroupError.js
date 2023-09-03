const ApiError = require('../apiError');

class BelongToGroupError extends ApiError {
  constructor(message) {
    super(message || 'You are belonging to the group.', 403);
  }
}

module.exports = BelongToGroupError;
