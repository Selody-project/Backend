const ApirError = require('../apiError');

class UserIsLeaderError extends ApirError {
  constructor(message) {
    super(message || 'Validation Error - Group leader cannot withdraw the account', 499);
  }
}

module.exports = UserIsLeaderError;
