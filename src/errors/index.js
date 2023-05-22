const APIError = require('./apiError');
const DataFormatError = require('./DataFormatError');

module.exports = {
  APIError,
  DataFormatError,
  ...require('./auth'),
};
