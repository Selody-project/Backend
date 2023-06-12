const express = require('express');
const { createToken } = require('../middleware/token');
const {
  patchUserProfile,
  patchUserPassword,
  putUserSchedule,
  getUserPersonalSchedule,
} = require('../controllers/user');
const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');

const router = express.Router();

router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.put('/calendar', putUserSchedule);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/calendar/:id', deletePersonalSchedule);
module.exports = router;
