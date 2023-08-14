const express = require('express');
const { createToken } = require('../middleware/token');
const {
  getUserGroup,
  patchUserProfile,
  patchUserPassword,
  putUserSchedule,
  getUserPersonalSchedule,
  getSingleUserSchedule,
} = require('../controllers/user');
const { getUserSetup, updateUserSetUp } = require('../controllers/userSetup');

const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');
const { deleteGroupUser } = require('../controllers/group');

const router = express.Router();

router.get('/group', getUserGroup);
router.delete('/group/:group_id', deleteGroupUser);
router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.patch('/userSetup/:user_id', updateUserSetUp);
router.get('/userSetup', getUserSetup);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.get('/calendar/:schedule_id', getSingleUserSchedule);
router.put('/calendar/:schedule_id', putUserSchedule);
router.delete('/calendar/:schedule_id', deletePersonalSchedule);
module.exports = router;
