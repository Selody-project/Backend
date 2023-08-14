const express = require('express');

const {
  createGroup,
  getGroupDetail,
  deleteGroup,
  patchGroup,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
  deleteGroupSchedule,
  getSingleGroupSchedule,
  postInviteLink,
  getInvitation,
  postGroupJoin,
  getEventProposal,
  postGroupPost,
  getSinglePost,
  getGroupPosts,
  putGroupPost,
  deleteGroupPost,
} = require('../controllers/group');

const router = express.Router();

router.post('/', createGroup);
router.get('/:group_id', getGroupDetail);
router.delete('/:group_id', deleteGroup);
router.patch('/:group_id', patchGroup);
router.post('/:group_id/calendar', postGroupSchedule);
router.get('/calendar/:schedule_id', getSingleGroupSchedule);
router.put('/calendar/:schedule_id', putGroupSchedule);
router.delete('/calendar/:schedule_id', deleteGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);
router.post('/:group_id/invite-link', postInviteLink);
router.get('/invite-link/:inviteCode', getInvitation);
router.post('/join/:inviteCode', postGroupJoin);
router.get('/:group_id/proposal', getEventProposal);
router.post('/:group_id/post', postGroupPost);
router.get('/:group_id/post/:post_id', getSinglePost);
router.get('/:group_id/post', getGroupPosts);
router.put('/:group_id/post/:post_id', putGroupPost);
router.delete('/:group_id/post/:post_id', deleteGroupPost);

module.exports = router;
