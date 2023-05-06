const express = require('express');

const {
  createGroup,
  getGroupList,
  getGroupSchedule,
  postGroupSchedule,
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);

router.post('/', createGroup);

router.post('/calendar', postGroupSchedule);

router.get('/:group_id/calendar', getGroupSchedule);

module.exports = router;
