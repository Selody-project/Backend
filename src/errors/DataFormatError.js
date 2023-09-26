const ApiError = require('./apiError');

class DataFormatError extends ApiError {
  constructor(message) {
    super(message || '지원하지 않는 형식의 데이터입니다.', 400);
  }
}

module.exports = DataFormatError;
