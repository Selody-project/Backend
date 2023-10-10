const express = require('express');
const auth = require('./auth');
const group = require('./group');
const user = require('./user');
const { verifyToken } = require('../middleware/token');

const router = express.Router();

router.use('/auth', auth);
const {
  setUpUserDB, setUpGroupDB,
  setUpGroupScheduleDB, setUpPersonalScheduleDB,
} = require('../../__test__/dbSetup');

router.post('/db', async (req, res, next) => {
  try {
    await setUpUserDB();
    await setUpGroupDB();
    await setUpPersonalScheduleDB();
    await setUpGroupScheduleDB();
    res.status(201).end();
  } catch (err) {
    console.log(err);
    return next(new Error('internal server error'));
  }
});

// 이 밑에 작성된 라우터에는 verifyToken 과정이 공통으로 적용
// 각 엔드포인트에 따로 verifyToken을 넣어주지 않아도 됨.
router.use('/*', verifyToken);

router.use('/group', group);
router.use('/user', user);

module.exports = router;
