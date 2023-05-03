const express = require('express');

const {
  getUserSchedule,
} = require('../controllers/user');
const { verifyToken } = require('../middleware/token');

const router = express.Router();

router.get('/:user_id/calendar', verifyToken, getUserSchedule);

module.exports = router;
