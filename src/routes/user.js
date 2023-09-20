const express = require('express');
const { createToken } = require('../middleware/token');
const { uploadMiddleware } = require('../middleware/s3');

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
const {
  deleteGroupUser,
} = require('../controllers/group');

// Feed
const {
  getUserFeed,
} = require('../controllers/feed');

const router = express.Router();

// User
router.get('/group', getUserGroup);
router.delete('/group/:group_id', deleteGroupUser);
router.patch('/profile', uploadMiddleware, patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.patch('/userSetup/:user_id', updateUserSetUp);
router.get('/userSetup', getUserSetup);

// Schedule
router.get('/calendar', getUserPersonalSchedule);
router.get('/calendar/:schedule_id', getSingleUserSchedule);
router.post('/calendar', postPersonalSchedule);
router.put('/calendar/:schedule_id', putPersonalSchedule);
router.delete('/calendar/:schedule_id', deletePersonalSchedule);

// Feed
router.get('/feed', getUserFeed);

module.exports = router;
