const ApiError = require('./apiError');

class FileTooLargeError extends ApiError {
  constructor(message) {
    super(message || 'File size exceeds the limit.(profile: 1MB, post: 3MB)', 413);
  }
}

module.exports = FileTooLargeError;
