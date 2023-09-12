const ApiError = require('../apiError');

class NoBanPermission extends ApiError {
  constructor(message) {
    super(message || 'You cannot ban the leader or administrator. ', 403);
  }
}

module.exports = NoBanPermission;
