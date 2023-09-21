const ApiError = require('../apiError');

class DuplicateNicknameError extends ApiError {
  constructor(message) {
    super(message || 'Nickname Already exists', 409);
  }
}

module.exports = DuplicateNicknameError;
