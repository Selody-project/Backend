const AppError = require('../errors');

// eslint-disable-next-line no-unused-vars
const appError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      type: 'Validator Error',
      errorCode: 400,
      message: error.details,
    });
  }

  if (error instanceof AppError) {
    return res.status(400).json({
      errorCode: 400,
      message: error.message,
    });
  }

  return res.status(500).send({ error: 'something went wrong' });
};

module.exports = appError;
