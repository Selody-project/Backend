import ApiError from '../apiError';

class DuplicateUserError extends ApiError {
  constructor(message: string = 'User Already exists') {
    super(message, 409);
    Object.setPrototypeOf(this, DuplicateUserError.prototype);
  }
}

export default DuplicateUserError;
