const express = require('express');

const {
  createGroup,
  getGroupList,
  getGroupSchedule,
//  postGroupSchedule,
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);

router.post('/', createGroup);

router.get('/:group_id/calendar', getGroupSchedule);

// router.post('/calendar', postGroupSchedule);

module.exports = router;
