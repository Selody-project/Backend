"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinSocialUser = exports.logout = exports.login = exports.join = exports.getGoogleUserInfo = exports.getNaverUserInfo = void 0;
var request_1 = require("request");
var bcrypt_1 = require("bcrypt");
var jwt = require("jsonwebtoken");
var jwksClient = require("jwks-rsa");
var sequelize_1 = require("sequelize");
// model
var user_1 = require("../models/user");
// error
var apiError_1 = require("../errors/apiError");
var errors_1 = require("../errors");
// validator
var validators_1 = require("../utils/validators");
function getNaverUserInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, header, apiUrl, options;
        var _this = this;
        return __generator(this, function (_a) {
            accessToken = req.body.accessToken;
            header = "Bearer ".concat(accessToken);
            apiUrl = 'https://openapi.naver.com/v1/nid/me';
            options = {
                url: apiUrl,
                headers: { Authorization: header },
            };
            // naver 사용자 정보 조회
            request_1.default.get(options, function (error, response, body) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!error && response.statusCode === 200) {
                        req.body = JSON.parse(body).response;
                        next();
                    }
                    else if (response !== null) {
                        res.status(response.statusCode).end();
                    }
                    return [2 /*return*/];
                });
            }); });
            return [2 /*return*/];
        });
    });
}
exports.getNaverUserInfo = getNaverUserInfo;
// Google 로그인 토큰 파싱
var client = jwksClient({
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
});
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.getPublicKey; // || key.rsaPublicKey;
        callback(null, signingKey);
    });
}
function getGoogleUserInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken;
        var _this = this;
        return __generator(this, function (_a) {
            try {
                accessToken = req.body.accessToken;
                if (!accessToken)
                    throw new errors_1.authErrors.InvalidTokenError();
                jwt.verify(accessToken, getKey, { algorithms: ['RS256'] }, function (err, decoded) { return __awaiter(_this, void 0, void 0, function () {
                    var userEmail, user;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (err) {
                                    return [2 /*return*/, res.status(401).json({ message: '토큰이 유효하지 않습니다.' })];
                                }
                                userEmail = decoded.email.split('@')[0];
                                return [4 /*yield*/, user_1.default.findOne({ where: { nickname: userEmail } })];
                            case 1:
                                user = _a.sent();
                                if (!!user) return [3 /*break*/, 3];
                                return [4 /*yield*/, user_1.default.create({
                                        nickname: userEmail,
                                        provider: 'GOOGLE',
                                    })];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3:
                                req.nickname = user.nickname;
                                next();
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (error) {
                if (error.name === 'TokenExpireError') {
                    return [2 /*return*/, next(new errors_1.authErrors.TokenExpireError())];
                }
                return [2 /*return*/, next(new errors_1.authErrors.InvalidTokenError())];
            }
            return [2 /*return*/];
        });
    });
}
exports.getGoogleUserInfo = getGoogleUserInfo;
function joinSocialUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var user, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, user_1.default.findOne({ where: { snsId: req.body.id } })];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, user_1.default.create({
                            nickname: req.body.nickname,
                            provider: 'NAVER',
                            snsId: req.body.id,
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    req.nickname = user.nickname;
                    next();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    if (error_1.name === 'TokenExpireError') {
                        return [2 /*return*/, next(new errors_1.authErrors.TokenExpireError())];
                    }
                    return [2 /*return*/, next(new errors_1.authErrors.InvalidTokenError())];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.joinSocialUser = joinSocialUser;
function join(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, _a, email, nickname, password, options, user, hash, err_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    error = (0, validators_1.validateJoinSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    _a = req.body, email = _a.email, nickname = _a.nickname, password = _a.password;
                    if (email && !nickname) {
                        options = { where: { email: email } };
                    }
                    else if (!email && nickname) {
                        options = { where: { nickname: nickname } };
                    }
                    else {
                        options = { where: (_b = {}, _b[sequelize_1.Op.or] = [{ email: email }, { nickname: nickname }], _b) };
                    }
                    return [4 /*yield*/, user_1.default.findOne(options)];
                case 1:
                    user = _c.sent();
                    if (user) {
                        return [2 /*return*/, next(new errors_1.authErrors.DuplicateUserError())];
                    }
                    if (!(email && nickname && password)) return [3 /*break*/, 7];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, bcrypt_1.default.hash(password, 12)];
                case 3:
                    hash = _c.sent();
                    return [4 /*yield*/, user_1.default.create({
                            email: email,
                            nickname: nickname,
                            password: hash,
                            provider: 'local',
                        })];
                case 4:
                    _c.sent();
                    req.nickname = nickname;
                    return [2 /*return*/, next()];
                case 5:
                    err_1 = _c.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 6: return [3 /*break*/, 8];
                case 7: return [2 /*return*/, res.status(200).send({ message: "It's possible to use" })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.join = join;
function login(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, _a, email, password, user, err_2, result, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    error = (0, validators_1.validateLoginSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    _a = req.body, email = _a.email, password = _a.password;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, user_1.default.findOne({ where: { email: email } })];
                case 2:
                    user = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _b.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4:
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.authErrors.InvalidIdPasswordError())];
                    }
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
                case 6:
                    result = _b.sent();
                    if (result) {
                        req.nickname = user.nickname;
                        return [2 /*return*/, next()];
                    }
                    return [2 /*return*/, next(new errors_1.authErrors.InvalidIdPasswordError())];
                case 7:
                    err_3 = _b.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.login = login;
function logout(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                return [2 /*return*/, res.status(200).clearCookie('accessToken').clearCookie('refreshToken').json({ message: 'Logout successful' })];
            }
            catch (err) {
                return [2 /*return*/, next(new apiError_1.default())];
            }
            return [2 /*return*/];
        });
    });
}
exports.logout = logout;
