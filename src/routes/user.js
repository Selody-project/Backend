const express = require('express');
const { createToken } = require('../middleware/token');
const {
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  putUserSchedule,
  getUserPersonalSchedule,
} = require('../controllers/user');
const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');
const { deleteGroupUser } = require('../controllers/group');

const router = express.Router();

router.get('/group', getUserGroup);
router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.put('/calendar/:id', putUserSchedule);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/group/:id', deleteGroupUser);
router.delete('/calendar/:id', deletePersonalSchedule);
module.exports = router;
