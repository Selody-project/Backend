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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putUserSchedule = exports.getUserPersonalSchedule = exports.patchUserPassword = exports.patchUserProfile = exports.getUserProfile = void 0;
var moment = require("moment");
var sequelize_1 = require("sequelize");
var bcrypt_1 = require("bcrypt");
// model
var user_1 = require("../models/user");
var personalSchedule_1 = require("../models/personalSchedule");
var groupSchedule_1 = require("../models/groupSchedule");
// error
var apiError_1 = require("../errors/apiError");
var errors_1 = require("../errors");
// validator
var validators_1 = require("../utils/validators");
function getUserProfile(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var nickname, user, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    nickname = req.nickname;
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: nickname } })];
                case 1:
                    user = _a.sent();
                    return [2 /*return*/, res.status(200).json({ user: user })];
                case 2:
                    err_1 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getUserProfile = getUserProfile;
function patchUserProfile(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, user, nickname, duplicate, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    error = (0, validators_1.validateJoinSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: req.nickname } })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.userErrors.UserNotFoundError())];
                    }
                    nickname = req.body.nickname;
                    return [4 /*yield*/, user_1.default.findAll({
                            where: (_a = {},
                                _a[sequelize_1.Op.and] = [
                                    { nickname: nickname },
                                    { userId: (_b = {}, _b[sequelize_1.Op.not] = user.userId, _b) },
                                ],
                                _a),
                        })];
                case 2:
                    duplicate = _c.sent();
                    if (duplicate.length > 0) {
                        return [2 /*return*/, next(new errors_1.authErrors.DuplicateUserError())];
                    }
                    return [4 /*yield*/, user.update({
                            nickname: nickname,
                        })];
                case 3:
                    _c.sent();
                    req.nickname = nickname;
                    next();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _c.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.patchUserProfile = patchUserProfile;
function patchUserPassword(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, password, user, _a, _b, err_3;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, , 5]);
                    error = (0, validators_1.validateJoinSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    password = req.body.password;
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: req.nickname } })];
                case 1:
                    user = _d.sent();
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.userErrors.UserNotFoundError())];
                    }
                    _b = (_a = user).update;
                    _c = {};
                    return [4 /*yield*/, bcrypt_1.default.hash(password, 12)];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_c.password = _d.sent(),
                            _c)])];
                case 3:
                    _d.sent();
                    return [2 /*return*/, res.status(200).end()];
                case 4:
                    err_3 = _d.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.patchUserPassword = patchUserPassword;
function getUserPersonalSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var user, queryError, _a, startDateTime, endDateTime, start, end, userEvent, groups, groupEvent, event_1, err_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: req.nickname } })];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.userErrors.UserNotFoundError())];
                    }
                    queryError = (0, validators_1.validateScheduleDateScehma)(req.query).error;
                    if (queryError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    _a = req.query, startDateTime = _a.startDateTime, endDateTime = _a.endDateTime;
                    start = moment.utc(startDateTime).toDate();
                    end = moment.utc(endDateTime).toDate();
                    return [4 /*yield*/, personalSchedule_1.default.getSchedule([user.userId], start, end)];
                case 2:
                    userEvent = _b.sent();
                    return [4 /*yield*/, user.getGroups()];
                case 3:
                    groups = (_b.sent()).map(function (group) { return group.groupId; });
                    if (!groups.length) return [3 /*break*/, 5];
                    return [4 /*yield*/, groupSchedule_1.default.getSchedule(groups, start, end)];
                case 4:
                    groupEvent = _b.sent();
                    event_1 = {
                        nonRecurrenceSchedule: __spreadArray(__spreadArray([], userEvent.nonRecurrenceSchedule, true), groupEvent.nonRecurrenceSchedule, true),
                        recurrenceSchedule: __spreadArray(__spreadArray([], userEvent.recurrenceSchedule, true), groupEvent.recurrenceSchedule, true),
                    };
                    return [2 /*return*/, res.status(200).json(event_1)];
                case 5: return [2 /*return*/, res.status(200).json(userEvent)];
                case 6:
                    err_4 = _b.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.getUserPersonalSchedule = getUserPersonalSchedule;
function putUserSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var paramError, bodyError, id, schedule, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    paramError = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (paramError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    bodyError = (0, validators_1.validateScheduleSchema)(req.body).error;
                    if (bodyError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    id = req.params.id;
                    return [4 /*yield*/, personalSchedule_1.default.findOne({ where: { id: id } })];
                case 1:
                    schedule = _a.sent();
                    if (!schedule) {
                        return [2 /*return*/, next(new errors_1.scheduleErrors.ScheduleNotFoundError())];
                    }
                    return [4 /*yield*/, personalSchedule_1.default.update(req.body, { where: { id: id } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res.status(201).json({ message: 'Successfully Modified.' })];
                case 3:
                    err_5 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.putUserSchedule = putUserSchedule;
