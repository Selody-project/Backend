const ApiError = require('./apiError');
const DataFormatError = require('./DataFormatError');
const FileTooLargeError = require('./FileTooLargeError');

module.exports = {
  ApiError,
  DataFormatError,
  FileTooLargeError,
  ...require('./auth'),
  ...require('./calendar'),
  ...require('./feed'),
  ...require('./group'),
  ...require('./schedule'),
  ...require('./user'),
};
