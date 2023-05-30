const express = require('express');

const {
  createGroup,
  getGroupList,
  deleteGroup,
  patchGroup,
  getGroupSchedule,
  postGroupSchedule,
  putGroupSchedule,
  deleteGroupSchedule,
} = require('../controllers/group');

const router = express.Router();

router.get('/', getGroupList);
router.post('/', createGroup);
router.delete('/:id', deleteGroup);
router.patch('/:id', patchGroup);
router.post('/calendar', postGroupSchedule);
router.put('/calendar/:id', putGroupSchedule);
router.delete('/calendar/:id', deleteGroupSchedule);
router.get('/:group_id/calendar', getGroupSchedule);

module.exports = router;
