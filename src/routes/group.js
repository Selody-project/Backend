const express = require('express');

// Group
const {
  postGroup, getGroupDetail, getGroupList, patchGroup, deleteGroup,
  postInviteLink, getInvitation, postGroupJoin,
} = require('../controllers/group');

// Schedule
const {
  getGroupSchedule, getSingleGroupSchedule,
  postGroupSchedule, putGroupSchedule, deleteGroupSchedule,
  getEventProposal,
} = require('../controllers/groupSchedule');

// Feed
const {
  postGroupPost, getGroupPosts, getSinglePost, putGroupPost, deleteGroupPost,
  postComment, getPostComment, getSingleComment, putComment, deleteComment,
} = require('../controllers/feed');

const router = express.Router();

// Group
router.post('/', postGroup);
router.get('/', getGroupList);
router.get('/:group_id', getGroupDetail);
router.patch('/:group_id', patchGroup);
router.delete('/:group_id', deleteGroup);
router.post('/:group_id/invite-link', postInviteLink);
router.get('/invite-link/:inviteCode', getInvitation);
router.post('/join/:inviteCode', postGroupJoin);

// Schedule
router.post('/:group_id/calendar', postGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);
router.get('/:group_id/calendar/:schedule_id', getSingleGroupSchedule);
router.put('/:group_id/calendar/:schedule_id', putGroupSchedule);
router.delete('/:group_id/calendar/:schedule_id', deleteGroupSchedule);
router.get('/:group_id/proposal', getEventProposal);

// Feed
router.post('/:group_id/post', postGroupPost);
router.get('/:group_id/post', getGroupPosts);
router.get('/:group_id/post/:post_id', getSinglePost);
router.put('/:group_id/post/:post_id', putGroupPost);
router.delete('/:group_id/post/:post_id', deleteGroupPost);
router.get('/:group_id/post/:post_id/comment', getPostComment);
router.get('/:group_id/post/:post_id/comment/:comment_id', getSingleComment);
router.post('/:group_id/post/:post_id/comment', postComment);
router.put('/:group_id/post/:post_id/comment/:comment_id', putComment);
router.delete('/:group_id/post/:post_id/comment/:comment_id', deleteComment);

module.exports = router;
