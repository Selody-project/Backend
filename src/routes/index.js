const express = require('express');
const auth = require('./auth');
const group = require('./group');
const user = require('./user');

const router = express.Router();

router.use('/auth', auth);
router.use('/group', group);
router.use('/user', user);

module.exports = router;
