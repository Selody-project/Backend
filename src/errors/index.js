const ApiError = require('./apiError');
const DataFormatError = require('./DataFormatError');
const FileTooLargeError = require('./FileTooLargeError');

// 커스텀 에러는 모두 여기에서 export
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
