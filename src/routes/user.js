const express = require('express');
const { createToken } = require('../middleware/token');
const {
  putUserProfile,
  putUserSchedule,
  getUserPersonalSchedule,
} = require('../controllers/user');
const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');

const router = express.Router();

router.put('/profile', putUserProfile, createToken);
router.put('/calendar', putUserSchedule);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/calendar/:id', deletePersonalSchedule);
module.exports = router;
