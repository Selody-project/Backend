const ApiError = require('../apiError');

class ImageLimitExceededError extends ApiError {
  constructor(message) {
    super(message || '이미지는 최대 3장까지만 업로드 가능합니다.', 413);
  }
}

module.exports = ImageLimitExceededError;
