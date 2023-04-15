const express = require('express');

const { getNaverUserInfo, createSocialUser } = require('../controllers/auth');
const { createToken, verifyToken } = require('../controllers/token');

const router = express.Router();

// GET /auth/login/naver
// 네이버 최초 로그인
router.post('/login/naver', getNaverUserInfo, createSocialUser, createToken);

// GET /auth/token
// 토큰 갱신
router.get('/token', verifyToken, createToken);

module.exports = router;
