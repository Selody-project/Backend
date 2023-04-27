const APIError = require('./apiError');

module.exports = {
  APIError,
  ...require('./auth'),
};
