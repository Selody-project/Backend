class ApiError extends Error {
  public status: number;

  constructor(message?: string, status?: number) {
    super();

    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message || 'Internal Server Error';
    this.status = status || 500;
  }
}

export default ApiError;
