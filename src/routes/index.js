"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var auth_1 = require("./auth");
var group_1 = require("./group");
var user_1 = require("./user");
var token_1 = require("../middleware/token");
var userSetup_1 = require("../controllers/userSetup");
var router = express.Router();
router.use('/auth', auth_1.default);
// 이 밑에 작성된 라우터에는 verifyToken 과정이 공통으로 적용
// 각 엔드포인트에 따로 verifyToken을 넣어주지 않아도 됨.
router.use('/*', token_1.verifyToken);
router.delete('/withdrawal/:user_id', userSetup_1.userWithdrawal);
router.use('/group', group_1.default);
router.use('/user', user_1.default);
exports.default = router;
