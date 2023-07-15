import ApiError from '../apiError';

class UserNotFoundError extends ApiError {
  constructor(message: string = 'User Not Found') {
    super(message, 404);
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export default UserNotFoundError;
