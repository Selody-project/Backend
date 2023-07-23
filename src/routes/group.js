const express = require('express');

const {
  createGroup,
  getGroupList,
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
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);
router.post('/', createGroup);
router.delete('/:id', deleteGroup);
router.patch('/:id', patchGroup);
router.post('/calendar', postGroupSchedule);
router.put('/calendar/:id', putGroupSchedule);
router.delete('/calendar/:id', deleteGroupSchedule);
router.get('/:id/calendar', getGroupSchedule);
router.post('/:group_id/invite-link', postInviteLink);
router.get('/invite-link/:inviteCode', getInvitation);
router.post('/join/:inviteCode', postGroupJoin);
router.get('/:group_id/proposal', getEventProposal);

module.exports = router;
