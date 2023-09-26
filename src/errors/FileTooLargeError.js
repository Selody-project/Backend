const ApiError = require('./apiError');

class FileTooLargeError extends ApiError {
  constructor(message) {
    super(message || '이미지 제한 크기를 초과하였습니다.', 413);
  }
}

module.exports = FileTooLargeError;
