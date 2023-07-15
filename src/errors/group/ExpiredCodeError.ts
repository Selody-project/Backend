import ApiError from '../apiError';

class ExpiredCodeError extends ApiError {
  constructor(message: string = 'Expired invitation code.') {
    super(message, 410);
    Object.setPrototypeOf(this, ExpiredCodeError.prototype);
  }
}

export default ExpiredCodeError;
