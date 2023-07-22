import express = require('express');
import { createToken } from '../middleware/token';
import {
  patchUserProfile, patchUserPassword, putUserSchedule, getUserPersonalSchedule,
} from '../controllers/user';

import { postPersonalSchedule, deletePersonalSchedule } from '../controllers/calendar';

import { deleteGroupUser } from '../controllers/group';

const router: express.Router = express.Router();

router.patch('/profile', patchUserProfile, createToken);
router.patch('/profile/password', patchUserPassword);
router.put('/calendar/:id', putUserSchedule);
router.get('/calendar', getUserPersonalSchedule);
router.post('/calendar', postPersonalSchedule);
router.delete('/group/:id', deleteGroupUser);
router.delete('/calendar/:id', deletePersonalSchedule);

export default router;
