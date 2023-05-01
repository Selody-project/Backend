const express = require('express');

const router = express.Router();

const { todo } = require('../controllers/todo');

router.post('/todo', todo);

module.exports = router;
