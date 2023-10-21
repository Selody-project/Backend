const express = require('express');
const { createToken } = require('../middleware/token');
const { uploadProfileMiddleware } = require('../middleware/s3');

// User
const {
  getUserGroup, getPendingGroupList,
  patchUserProfile, patchUserPassword,
  getUserSetup, patchUserSetUp, patchIntroduction,
} = require('../controllers/user');

// Schedule
const {
  getUserPersonalSchedule, getSingleUserSchedule, getUserPersonalScheduleSummary,
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
router.get('/group/pending', getPendingGroupList);
router.delete('/group/:group_id', deleteGroupUser);
router.patch('/profile', uploadProfileMiddleware, patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.get('/settings', getUserSetup);
router.patch('/settings/:group_id', patchUserSetUp);
router.patch('/introduction', patchIntroduction);

// Schedule
router.get('/calendar', getUserPersonalSchedule);
router.get('/calendar/summary', getUserPersonalScheduleSummary);
router.get('/calendar/:schedule_id', getSingleUserSchedule);
router.post('/calendar', postPersonalSchedule);
router.put('/calendar/:schedule_id', putPersonalSchedule);
router.delete('/calendar/:schedule_id', deletePersonalSchedule);

// Feed
router.get('/post', getUserFeed);

module.exports = router;
