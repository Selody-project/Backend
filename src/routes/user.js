const express = require('express');

const {
  getUserSchedule, putUserSchedule,
} = require('../controllers/user');

const router = express.Router();

router.get('/:user_id/calendar', getUserSchedule);
router.put('/calendar', putUserSchedule);

module.exports = router;
