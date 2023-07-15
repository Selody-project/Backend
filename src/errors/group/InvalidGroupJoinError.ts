import ApiError from '../apiError';

class InvalidGroupJoinError extends ApiError {
  constructor(message: string = 'You are already a member of this group.') {
    super(message, 403);
    Object.setPrototypeOf(this, InvalidGroupJoinError.prototype);
  }
}

export default InvalidGroupJoinError;
