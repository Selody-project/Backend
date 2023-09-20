const ApiError = require('./apiError');

class FileTooLargeError extends ApiError {
  constructor(message) {
    super(message || 'File size exceeds the limit.(2MB)', 413);
  }
}

module.exports = FileTooLargeError;
