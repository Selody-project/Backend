import ApiError from '../apiError';

class DuplicateUserError extends ApiError {
  constructor(message) {
    super(message || 'User Already exists', 409);
    Object.setPrototypeOf(this, DuplicateUserError.prototype);
  }
}

export default DuplicateUserError;
