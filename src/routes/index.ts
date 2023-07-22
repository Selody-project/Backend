import express = require('express');
import auth from './auth';
import group from './group';
import user from './user';
import { verifyToken } from '../middleware/token';
import { userWithdrawal } from '../controllers/userSetup';

const router: express.Router = express.Router();

router.use('/auth', auth);

// 이 밑에 작성된 라우터에는 verifyToken 과정이 공통으로 적용
// 각 엔드포인트에 따로 verifyToken을 넣어주지 않아도 됨.
router.use('/*', verifyToken);

router.delete('/withdrawal/:user_id', userWithdrawal);
router.use('/group', group);
router.use('/user', user);

export default router;
