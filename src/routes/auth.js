const express = require('express');

const { getNaverUserInfo, createSocialUser } = require('../controllers/auth');
const { createToken } = require('../controllers/token');

const router = express.Router();

// GET /auth/login/naver
router.post('/login/naver', getNaverUserInfo, createSocialUser, createToken);

module.exports = router;
