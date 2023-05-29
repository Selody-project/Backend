const express = require('express');

const {
  createGroup,
  getGroupList,
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

router.post('/calendar', postGroupSchedule);
router.put('/calendar/:id', putGroupSchedule);
router.delete('/calendar/:id', deleteGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);

router.post('/invite-link/:group_id', postInviteLink);
router.get('/invite-link/:inviteCode',getInvitation);
router.post('/join/:inviteCode', postGroupJoin);
module.exports = router;
