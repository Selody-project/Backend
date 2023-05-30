const APIError = require('./apiError');
const DataFormatError = require('./DataFormatError');
const ExpiredCodeError = require('./ExpiredCodeError');
const InvalidGroupJoinError = require('./InvalidGroupJoinError');

module.exports = {
  APIError,
  DataFormatError,
  ExpiredCodeError,
  InvalidGroupJoinError,
  ...require('./auth'),
};
