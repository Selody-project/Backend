const ApiError = require('../apiError');

class NoBanPermission extends ApiError {
  constructor(message) {
    super(message || '방장이나 관리자는 강퇴할 수 없습니다. ', 403);
  }
}

module.exports = NoBanPermission;
