const express = require('express');
const { createToken } = require('../middleware/token');
const {
  putUserProfile,
  putUserSchedule,
  getUserPersonalMonthSchedule,
  getUserPersonalDaySchedule,
} = require('../controllers/user');

const router = express.Router();

router.put('/profile', putUserProfile, createToken);
router.put('/calendar', putUserSchedule);
router.get('/:user_id/calendar', getUserPersonalMonthSchedule);
router.get('/:user_id/calendar/todo', getUserPersonalDaySchedule);

module.exports = router;
