const express = require('express');

const {
  getUserPersonalSchedule, putUserSchedule,getUserPersonalDaySchedule,
} = require('../controllers/user');

const router = express.Router();

router.get('/:user_id/calendar', getUserPersonalSchedule);
router.put('/calendar', putUserSchedule);
router.get('/:user_id/calendar/todo', getUserPersonalDaySchedule);

module.exports = router;
