const express = require('express');

const {
  createGroup,
  getGroupList,
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
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);
router.post('/', createGroup);
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

module.exports = router;
