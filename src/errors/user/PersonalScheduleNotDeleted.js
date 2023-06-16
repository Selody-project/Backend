const ApirError = require('../apiError');

class PersonalScheduleNotDeleted extends ApirError {
  constructor(message) {
    super(message || 'PersonalSchedule is Not Deleted', 404);
  }
}

module.exports = PersonalScheduleNotDeleted;
