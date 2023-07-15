import ApiError from '../apiError';

class NotNullValidationError extends ApiError {
  constructor(message: string = 'Not Null Validation') {
    super(message, 400);
    Object.setPrototypeOf(this, NotNullValidationError.prototype);
  }
}

export default NotNullValidationError;
