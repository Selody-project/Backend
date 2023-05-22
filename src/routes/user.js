const express = require('express');

const {
  getUserPersonalMonthSchedule, putUserSchedule,getUserPersonalDaySchedule,
} = require('../controllers/user');

const router = express.Router();

router.get('/:user_id/calendar', getUserPersonalMonthSchedule);
router.put('/calendar', putUserSchedule);
router.get('/:user_id/calendar/todo', getUserPersonalDaySchedule);

module.exports = router;
