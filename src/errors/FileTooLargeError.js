const ApiError = require('./apiError');

class FileTooLargeError extends ApiError {
  constructor(message) {
    super(message || 'File size exceeds the limit.(1MB)', 413);
  }
}

module.exports = FileTooLargeError;
