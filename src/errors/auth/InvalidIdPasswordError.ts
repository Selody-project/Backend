import ApiError from '../apiError';

class InvalidIdPasswordError extends ApiError {
  constructor(message: string = 'Invalid User ID/Password') {
    super(message, 401);
    Object.setPrototypeOf(this, InvalidIdPasswordError.prototype);
  }
}

export default InvalidIdPasswordError;
