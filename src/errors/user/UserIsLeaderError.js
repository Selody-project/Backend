const ApirError = require('../apiError');

class UserIsLeaderError extends ApirError {
  constructor(message) {
    super(message || '그룹의 리더는 탈퇴할 수 없습니다.', 499);
  }
}

module.exports = UserIsLeaderError;
