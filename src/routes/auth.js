const express = require('express');

const {
  getNaverUserInfo, joinSocialUser, join, login,
} = require('../controllers/auth');
const { createToken, verifyToken, renewToken } = require('../middleware/token');
const { getUserInfo } = require('../controllers/user');

const router = express.Router();

// GET api/auth/join
router.post('/join', join, createToken);

// GET api/auth/login
router.post('/login', login, createToken);

// GET api/auth/logout
// router.get('/logout', );

// GET api/auth/naver
router.post('/naver', getNaverUserInfo, joinSocialUser, createToken);

// GET api/auth/google
// router.post('/google', joinSocialUser, createToken);

// GET api/auth/token/refresh
router.get('/token/refresh', renewToken);

// GET api/auth/token/verify
router.get('/token/verify', verifyToken, getUserInfo);

module.exports = router;
