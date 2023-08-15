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
  postInviteLink,
  getInvitation,
  postGroupJoin,
  getEventProposal,
  postGroupPost,
  getGroupList,
} = require('../controllers/group');

const router = express.Router();

router.post('/', createGroup);
router.get('/', getGroupList);
router.get('/:group_id', getGroupDetail);
router.delete('/:group_id', deleteGroup);
router.patch('/:group_id', patchGroup);
router.post('/calendar', postGroupSchedule);
router.put('/calendar/:id', putGroupSchedule);
router.delete('/calendar/:id', deleteGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);
router.post('/:group_id/invite-link', postInviteLink);
router.get('/invite-link/:inviteCode', getInvitation);
router.post('/join/:inviteCode', postGroupJoin);
router.get('/:group_id/proposal', getEventProposal);

router.post('/:group_id/post', postGroupPost);

module.exports = router;
