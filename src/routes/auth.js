const express = require('express');

const {
  getNaverUserInfo, joinSocialUser, join, login,
} = require('../controllers/auth');
const { createToken, verifyToken } = require('../middleware/token');

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

// GET api/auth/token
router.get('/token', verifyToken, createToken);

// GET api/auth/token/verify
router.get('/token/verify', verifyToken, (req, res) => res.status(200).json({
  message: '유효한 토큰입니다',
  nickname: req.body.nickname,
}));

module.exports = router;
