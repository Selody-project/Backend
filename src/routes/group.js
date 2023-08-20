const express = require('express');

const {
  getGroupDetail, createGroup, patchGroup, deleteGroup,
  getGroupSchedule, postGroupSchedule, putGroupSchedule, deleteGroupSchedule, getSingleGroupSchedule,
  postInviteLink, getInvitation, postGroupJoin,
  getEventProposal,
  getGroupList,
  getGroupPosts, getSinglePost, postGroupPost, putGroupPost, deleteGroupPost,
  getPostComment, getSingleComment, postComment, putComment, deleteComment,
} = require('../controllers/group');

const router = express.Router();

// Group
router.post('/', createGroup);
router.get('/', getGroupList);
router.get('/:group_id', getGroupDetail);
router.delete('/:group_id', deleteGroup);
router.patch('/:group_id', patchGroup);
router.post('/:group_id/invite-link', postInviteLink);
router.get('/invite-link/:inviteCode', getInvitation);
router.post('/join/:inviteCode', postGroupJoin);

// Schedule
router.post('/:group_id/calendar', postGroupSchedule);
router.get('/calendar/:schedule_id', getSingleGroupSchedule);
router.put('/calendar/:schedule_id', putGroupSchedule);
router.delete('/calendar/:schedule_id', deleteGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);
router.get('/:group_id/proposal', getEventProposal);

// Post
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
