import ApiError from './apiError';

class DataFormatError extends ApiError {
  constructor(message: string = 'The requested data format is not valid.') {
    super(message, 400);
    Object.setPrototypeOf(this, DataFormatError.prototype);
  }
}

export default DataFormatError;
