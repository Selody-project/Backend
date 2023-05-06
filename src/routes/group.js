const express = require('express');

const {
  createGroup,
  getGroupList,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);
router.post('/', createGroup);
router.post('/calendar', postGroupSchedule);
router.put('/calendar', putGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);

module.exports = router;
