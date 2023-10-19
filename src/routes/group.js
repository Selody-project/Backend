const express = require('express');

// Group
const {
  postGroup,
  getGroupInfo, getGroupDetail, getGroupList,
  putGroup, deleteGroup,
  getGroupMembers, getPendingMembers,
  postGroupJoinRequest, postGroupJoinApprove, postGroupJoinReject,
  getInviteLink, postInviteLink,
  getGroupPreviewWithInviteCode, postJoinGroupWithInviteCode,
  deleteGroupMember,
  searchGroup,
  patchUserAccessLevel,
} = require('../controllers/group');

// Schedule
const {
  getGroupSchedule, getSingleGroupSchedule, getGroupScheduleSummary,
  deleteGroupSchedule,
  postScheduleProposal, getScheduleProposal, getScheduleProposalsList, deleteScheduleProposal,
  postScheduleProposalVote, postScheduleProposalConfirm,
  getScheduleProposals,
} = require('../controllers/groupSchedule');

// Feed
const {
  postGroupPost, getGroupPosts, getSinglePost, putGroupPost, deleteGroupPost,
  postGroupPostLike, deleteGroupPostLike,
  postComment, getPostComment, getSingleComment, putComment, deleteComment,
} = require('../controllers/feed');
const {
  uploadGroupMiddleware, uploadPostMiddleware,
} = require('../middleware/s3');

const router = express.Router();

// Group
router.post('/', uploadGroupMiddleware, postGroup);
router.get('/list', getGroupList);
router.get('/search', searchGroup);
router.get('/:group_id/info', getGroupInfo);
router.get('/:group_id', getGroupDetail);
router.put('/:group_id', uploadGroupMiddleware, putGroup);
router.delete('/:group_id', deleteGroup);
router.get('/:group_id/members', getGroupMembers);
router.get('/:group_id/members/request', getPendingMembers);
router.post('/:group_id/members/request', postGroupJoinRequest);
router.post('/:group_id/members/:user_id/approve', postGroupJoinApprove);
router.post('/:group_id/members/:user_id/reject', postGroupJoinReject);
router.delete('/:group_id/members/:user_id', deleteGroupMember);
router.get('/invite-link/:inviteCode', getGroupPreviewWithInviteCode);
router.get('/:group_id/join/invite-link', getInviteLink);
router.post('/:group_id/join/invite-link', postInviteLink);
router.post('/:group_id/join/:inviteCode', postJoinGroupWithInviteCode);
router.patch('/:group_id/members/:user_id/access-level', patchUserAccessLevel);

// Schedule
router.get('/:group_id/calendar', getGroupSchedule);
router.get('/:group_id/calendar/summary', getGroupScheduleSummary);
router.get('/:group_id/calendar/:schedule_id', getSingleGroupSchedule);
router.delete('/:group_id/calendar/:schedule_id', deleteGroupSchedule);

// Schedule Vote단일 일정 후보를 사용자가 직접 등록해서 CRUD
router.post('/:group_id/proposal', postScheduleProposal);
router.get('/:group_id/proposals', getScheduleProposals);
router.get('/:group_id/proposal/list', getScheduleProposalsList);
router.get('/:group_id/proposal/:proposal_id', getScheduleProposal);
router.delete('/:group_id/proposal/:proposal_id', deleteScheduleProposal);
router.post('/:group_id/proposal/:proposal_id/vote', postScheduleProposalVote);
router.post('/:group_id/proposal/:proposal_id/confirm', postScheduleProposalConfirm);

// Feed
router.post('/:group_id/post', uploadPostMiddleware, postGroupPost);
router.get('/:group_id/post', getGroupPosts);
router.get('/:group_id/post/:post_id', getSinglePost);
router.put('/:group_id/post/:post_id', uploadPostMiddleware, putGroupPost);
router.delete('/:group_id/post/:post_id', deleteGroupPost);

router.post('/:group_id/post/:post_id/like', postGroupPostLike);
router.delete('/:group_id/post/:post_id/like', deleteGroupPostLike);

router.get('/:group_id/post/:post_id/comment', getPostComment);
router.get('/:group_id/post/:post_id/comment/:comment_id', getSingleComment);
router.post('/:group_id/post/:post_id/comment', postComment);
router.put('/:group_id/post/:post_id/comment/:comment_id', putComment);
router.delete('/:group_id/post/:post_id/comment/:comment_id', deleteComment);

module.exports = router;
