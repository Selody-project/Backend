const ApiError = require('./apiError');
const DataFormatError = require('./DataFormatError');

module.exports = {
  ApiError,
  DataFormatError,
  ...require('./auth'),
  ...require('./group'),
  ...require('./schedule'),
  ...require('./user'),
  ...require('./feed'),
};
