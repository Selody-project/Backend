const express = require('express');
const { createToken } = require('../middleware/token');

// User
const {
  getUserGroup,
  patchUserProfile, patchUserPassword,
  getUserSetup, updateUserSetUp,
} = require('../controllers/user');

// Schedule
const {
  getUserPersonalSchedule, getSingleUserSchedule,
  postPersonalSchedule, putPersonalSchedule, deletePersonalSchedule,
} = require('../controllers/personalSchedule');

const { deleteGroupUser } = require('../controllers/group');

const router = express.Router();

// User
router.get('/group', getUserGroup);
router.delete('/group/:group_id', deleteGroupUser);
router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.patch('/userSetup/:user_id', updateUserSetUp);
router.get('/userSetup', getUserSetup);

// Schedule
router.get('/calendar', getUserPersonalSchedule);
router.get('/calendar/:schedule_id', getSingleUserSchedule);
router.post('/calendar', postPersonalSchedule);
router.put('/calendar/:schedule_id', putPersonalSchedule);
router.delete('/calendar/:schedule_id', deletePersonalSchedule);
module.exports = router;
