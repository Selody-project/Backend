import ApiError from '../apiError';

class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found data') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export default NotFoundError;
