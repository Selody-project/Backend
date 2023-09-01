const express = require('express');

// Group
const {
  postGroup,
  getGroupInfo, getGroupDetail, getGroupList,
  putGroup, deleteGroup,
  getGroupMembers,
  postGroupJoinRequest, postGroupJoinApprove, postGroupJoinReject,
  postInviteLink, postJoinGroupWithInviteCode,
  deleteGroupMember,
  searchGroup,
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
router.get('/search', searchGroup);
router.get('/:group_id/info', getGroupInfo);
router.get('/:group_id', getGroupDetail);
router.put('/:group_id', putGroup);
router.delete('/:group_id', deleteGroup);
router.get('/:group_id/members', getGroupMembers);
router.post('/:group_id/members/request', postGroupJoinRequest);
router.post('/:group_id/members/:user_id/approve', postGroupJoinApprove);
router.post('/:group_id/members/:user_id/reject', postGroupJoinReject);
router.delete('/:group_id/members/:user_id', deleteGroupMember);
router.post('/:group_id/join/invite-link', postInviteLink);
router.post('/:group_id/join/:inviteCode', postJoinGroupWithInviteCode);

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
