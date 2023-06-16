const express = require('express');
const auth = require('./auth');
const group = require('./group');
const user = require('./user');
const { verifyToken } = require('../middleware/token');
const { userWithdrawal } = require('../controllers/userSetup');

const router = express.Router();

router.use('/auth', auth);

// 이 밑에 작성된 라우터에는 verifyToken 과정이 공통으로 적용
// 각 엔드포인트에 따로 verifyToken을 넣어주지 않아도 됨.
router.use('/*', verifyToken);

router.delete('/withdrawal/:id', userWithdrawal);
router.use('/group', group);
router.use('/user', user);

module.exports = router;
