const express = require('express');

const {
  getUserSchedule,
} = require('../controllers/user');
const { verifyToken } = require('../middleware/token');
const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');

const router = express.Router();

router.get('/:user_id/calendar', verifyToken, getUserSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/calendar', deletePersonalSchedule);
module.exports = router;
