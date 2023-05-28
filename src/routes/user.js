const express = require('express');

const {
  getUserSchedule, putUserSchedule, getUserDaySchedule,
} = require('../controllers/user');
const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');

const router = express.Router();

router.get('/:user_id/calendar', getUserSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/calendar', deletePersonalSchedule);
router.put('/calendar', putUserSchedule);
router.get('/:user_id/calendar/todo', getUserDaySchedule);

module.exports = router;
