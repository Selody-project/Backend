import ApiError from '../apiError';

class UserIsLeaderError extends ApiError {
  constructor(message: string = 'Validation Error - Group leader cannot withdraw the account') {
    super(message, 499);
    Object.setPrototypeOf(this, UserIsLeaderError.prototype);
  }
}

export default UserIsLeaderError;
