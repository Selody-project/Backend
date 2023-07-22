import express = require('express');

import {
  getNaverUserInfo, getGoogleUserInfo, joinSocialUser, join, login, logout,
} from '../controllers/auth';

import { createToken, verifyToken, renewToken } from '../middleware/token';

import { getUserProfile } from '../controllers/user';

const router: express.Router = express.Router();

router.post('/join', join, createToken);
router.post('/login', login, createToken);
router.delete('/logout', verifyToken, logout);
router.post('/naver', getNaverUserInfo, joinSocialUser, createToken);
router.post('/google', getGoogleUserInfo, createToken);
router.get('/token/refresh', renewToken);
router.get('/token/verify', verifyToken, getUserProfile);

export default router;
