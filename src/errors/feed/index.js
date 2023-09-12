const PostNotFoundError = require('./PostNotFoundError');
const EditPermissionError = require('./EditPermissionError');
const CommentNotFoundError = require('./CommentNotFoundError');
const DuplicateLikeError = require('./DuplicateLikeError');

module.exports = {
  PostNotFoundError,
  CommentNotFoundError,
  EditPermissionError,
  DuplicateLikeError,
};
