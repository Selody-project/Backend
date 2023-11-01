const express = require('express');

const {
  getNaverUserInfo, getGoogleUserInfo, joinNaverUser,
  join, login, logout,
} = require('../controllers/auth');

const {
  createToken, verifyToken, renewToken,
} = require('../middleware/token');

const {
  withdrawal,
} = require('../controllers/user');

const router = express.Router();

router.post('/join', join, createToken);
router.post('/login', login, createToken);
router.delete('/logout', verifyToken, logout);
router.post('/naver', getNaverUserInfo, joinNaverUser, createToken);
router.post('/google', getGoogleUserInfo, createToken);
router.get('/token/refresh', renewToken);
router.get('/token/verify', verifyToken, (req, res) => res.status(200).end());
router.delete('/withdrawal', verifyToken, withdrawal);

module.exports = router;
