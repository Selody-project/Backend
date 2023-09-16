const ApiError = require('../apiError');

class ScheduleNotFoundError extends ApiError {
  constructor(message) {
    super(message || 'Schedule Not Found', 404);
  }
}

module.exports = ScheduleNotFoundError;
