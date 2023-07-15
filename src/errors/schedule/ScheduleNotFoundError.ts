import ApiError from '../apiError';

class UnauthorizedError extends ApiError {
  constructor(message: string = 'Schedule Not Found') {
    super(message, 403);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export default UnauthorizedError;
