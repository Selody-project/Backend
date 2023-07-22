"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewToken = exports.verifyToken = exports.createToken = void 0;
var jwt = require("jsonwebtoken");
var apiError_1 = require("../errors/apiError");
var TokenExpireError_1 = require("../errors/auth/TokenExpireError");
var InvalidTokenError_1 = require("../errors/auth/InvalidTokenError");
var ACCESS_SECRET_KEY = process.env.JWT_SECRET || '';
var REFRESH_SECRET_KEY = process.env.JWT_SECRET || '';
var token = function () { return ({
    access: function (nickname) {
        return jwt.sign({
            nickname: nickname,
        }, ACCESS_SECRET_KEY, {
            expiresIn: '60m',
            issuer: 'xernserver',
        });
    },
    refresh: function (nickname) {
        return jwt.sign({
            nickname: nickname,
        }, REFRESH_SECRET_KEY, {
            expiresIn: '180 days',
            issuer: 'xernserver',
        });
    },
}); };
// jwt 발급
// nickname을 이용해 발급하므로 해당 미들웨어를 이용할 때, req에 nickname을 전달해줘야함.
function createToken(req, res, next) {
    try {
        var nickname = req.nickname;
        var accessToken = token().access(nickname);
        var refreshToken = token().access(nickname);
        res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
        return res.status(200).json({
            message: 'JWT 발급에 성공하였습니다',
            nickname: nickname,
        });
    }
    catch (error) {
        return next(new apiError_1.default());
    }
}
exports.createToken = createToken;
// jwt 검증
function verifyToken(req, res, next) {
    try {
        var authToken = req.cookies.accessToken;
        if (!authToken)
            throw new InvalidTokenError_1.default();
        var nickname = jwt.verify(authToken, ACCESS_SECRET_KEY).nickname;
        req.nickname = nickname;
        return next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new TokenExpireError_1.default());
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new InvalidTokenError_1.default());
        }
        return next(new apiError_1.default());
    }
}
exports.verifyToken = verifyToken;
function renewToken(req, res, next) {
    try {
        var authToken = req.cookies.refreshToken;
        if (!authToken)
            throw new InvalidTokenError_1.default();
        var nickname = jwt.verify(authToken, REFRESH_SECRET_KEY).nickname;
        var accessToken = token().access(nickname);
        res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: false });
        return res.status(200).json({
            message: 'Token renewal successful',
            nickname: req.nickname,
        });
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new TokenExpireError_1.default());
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new InvalidTokenError_1.default());
        }
        return next(new apiError_1.default());
    }
}
exports.renewToken = renewToken;
