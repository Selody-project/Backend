const ApiError = require('../apiError');

class ImageLimitExceededError extends ApiError {
  constructor(message) {
    super(message || 'Image upload limit exceeded. You can upload a maximum of 3 images. ', 413);
  }
}

module.exports = ImageLimitExceededError;
