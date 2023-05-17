const express = require('express');

const {
  getUserSchedule, putUserSchedule,getUserDaySchedule,
} = require('../controllers/user');

const router = express.Router();

router.get('/:user_id/calendar', getUserSchedule);
router.put('/calendar', putUserSchedule);
router.get('/:user_id/calendar/todo', getUserDaySchedule);

module.exports = router;
