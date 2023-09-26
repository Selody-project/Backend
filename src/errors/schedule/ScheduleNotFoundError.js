const ApiError = require('../apiError');

class ScheduleNotFoundError extends ApiError {
  constructor(message) {
    super(message || '일정을 찾을 수 없습니다.', 404);
  }
}

module.exports = ScheduleNotFoundError;
