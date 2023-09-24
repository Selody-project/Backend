const PostNotFoundError = require('./PostNotFoundError');
const EditPermissionError = require('./EditPermissionError');
const CommentNotFoundError = require('./CommentNotFoundError');
const DuplicateLikeError = require('./DuplicateLikeError');
const ImageLimitExceededError = require('./ImageLimitExceededError');

module.exports = {
  PostNotFoundError,
  CommentNotFoundError,
  EditPermissionError,
  DuplicateLikeError,
  ImageLimitExceededError,
};
