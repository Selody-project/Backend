import ApiError from '../apiError';

class GroupNotFoundError extends ApiError {
  constructor(message: string = 'Group Not Found') {
    super(message, 404);
    Object.setPrototypeOf(this, GroupNotFoundError.prototype);
  }
}

export default GroupNotFoundError;
