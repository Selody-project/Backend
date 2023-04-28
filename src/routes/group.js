const express = require('express');

const {
  getGroupSchedule,
} = require('../controllers/group');
const { verifyToken } = require('../middleware/token');

const router = express.Router();

router.get('/:group_id/calendar', verifyToken, getGroupSchedule);

module.exports = router;
