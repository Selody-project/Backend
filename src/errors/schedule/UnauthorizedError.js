const ApiError = require('../apiError');

class UnathroizedError extends ApiError {
  constructor(message) {
    super(message || 'Unathorized access', 403);
  }
}

module.exports = UnathroizedError;
