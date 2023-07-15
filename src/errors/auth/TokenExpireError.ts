import ApiError from '../apiError';

class TokenExpireError extends ApiError {
  constructor(message: string = 'Expired Token') {
    super(message, 401);
    Object.setPrototypeOf(this, TokenExpireError.prototype);
  }
}

export default TokenExpireError;
