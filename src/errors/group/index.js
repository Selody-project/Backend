const GroupNotFoundError = require('./GroupNotFoundError');
const ExpiredCodeError = require('./ExpiredCodeError');
const InvalidGroupJoinError = require('./InvalidGroupJoinError');
const NoBanPermission = require('./NoBanPermission');
const ExceedGroupCountError = require('./ExceedGroupCountError');

module.exports = {
  GroupNotFoundError,
  ExpiredCodeError,
  InvalidGroupJoinError,
  NoBanPermission,
  ExceedGroupCountError,
};
