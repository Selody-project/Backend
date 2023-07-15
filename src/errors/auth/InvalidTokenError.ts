import ApiError from '../apiError';

class InvalidTokenError extends ApiError {
  constructor(message: string = 'Invalid Token') {
    super(message, 401);
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

export default InvalidTokenError;
