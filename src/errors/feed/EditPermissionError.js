const ApiError = require('../apiError');

class EditPermissionError extends ApiError {
  constructor(message) {
    super(message || 'You do not have permission to modify.', 403);
  }
}

module.exports = EditPermissionError;
