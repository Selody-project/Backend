const express = require('express');
const { createToken } = require('../middleware/token');
const {
  patchUserProfile,
  patchUserPassword,
  putUserSchedule,
  getUserPersonalSchedule,
} = require('../controllers/user');
const { getUserSetup, updateUserSetUp } = require('../controllers/userSetup');

const { postPersonalSchedule, deletePersonalSchedule } = require('../controllers/calendar');
const { deleteGroupUser } = require('../controllers/group');

const router = express.Router();

router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.post('/userSetup/:user_id', updateUserSetUp);
router.get('/userSetup', getUserSetup);
router.put('/calendar/:id', putUserSchedule);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/group/:id', deleteGroupUser);
router.delete('/calendar/:id', deletePersonalSchedule);
module.exports = router;
