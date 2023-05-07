const express = require('express');

const {
  getUserSchedule,
  getUserDaySchedule,
} = require('../controllers/user');

const router = express.Router();

router.get('/:user_id/calendar', getUserSchedule);

router.get('/:user_id/calendar/todo', getUserDaySchedule);

module.exports = router;
