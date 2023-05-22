const ApiError = require('./apiError');

class DataFormatError extends ApiError {
  constructor(message) {
    super(message || 'The requested data format is not valid.', 400);
  }
}

module.exports = DataFormatError;
