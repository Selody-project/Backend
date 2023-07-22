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
exports.postGroupJoin = exports.getInvitation = exports.postInviteLink = exports.deleteGroupSchedule = exports.putGroupSchedule = exports.postGroupSchedule = exports.getGroupSchedule = exports.deleteGroupUser = exports.patchGroup = exports.deleteGroup = exports.getGroupList = exports.createGroup = void 0;
var moment = require("moment");
// model
var user_1 = require("../models/user");
var userGroup_1 = require("../models/userGroup");
var group_1 = require("../models/group");
var groupSchedule_1 = require("../models/groupSchedule");
var personalSchedule_1 = require("../models/personalSchedule");
// error
var apiError_1 = require("../errors/apiError");
var errors_1 = require("../errors");
// validator
var validators_1 = require("../utils/validators");
function createGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, nickname, name_1, user, group, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    error = (0, validators_1.validateGroupSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    nickname = req.nickname;
                    name_1 = req.body.name;
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: nickname } })];
                case 1:
                    user = _a.sent();
                    return [4 /*yield*/, group_1.default.create({ name: name_1, member: 1, leader: user === null || user === void 0 ? void 0 : user.userId })];
                case 2:
                    group = _a.sent();
                    if (!user) return [3 /*break*/, 4];
                    return [4 /*yield*/, user.addGroup(group)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, res.status(200).json({ message: 'Successfully create group' })];
                case 5:
                    err_1 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.createGroup = createGroup;
function getGroupList(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var nickname, user, groupList, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    nickname = req.nickname;
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: nickname } })];
                case 1:
                    user = _a.sent();
                    return [4 /*yield*/, user.getGroups()];
                case 2:
                    groupList = _a.sent();
                    return [2 /*return*/, res.status(200).json({ groupList: groupList })];
                case 3:
                    err_2 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getGroupList = getGroupList;
function deleteGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, id, group, user, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    error = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    id = req.params.id;
                    return [4 /*yield*/, group_1.default.findByPk(id)];
                case 1:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: req.nickname } })];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.userErrors.UserNotFoundError())];
                    }
                    if (group.leader !== user.userId) {
                        return [2 /*return*/, next(new errors_1.scheduleErrors.UnauthorizedError())];
                    }
                    return [4 /*yield*/, group.destroy()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, res.status(204).json({ message: 'Successfully delete group' })];
                case 4:
                    err_3 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.deleteGroup = deleteGroup;
function patchGroup(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, id, newLeaderId, group, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    error = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    id = req.params.id;
                    newLeaderId = req.body.newLeaderId;
                    return [4 /*yield*/, group_1.default.findByPk(id)];
                case 1:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    group.leader = newLeaderId;
                    return [4 /*yield*/, group.save()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res.status(200).json({ message: 'Successfully update group leader' })];
                case 3:
                    err_4 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.patchGroup = patchGroup;
function deleteGroupUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, user, userId, groupId, group, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    error = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: req.nickname } })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, next(new errors_1.userErrors.UserNotFoundError())];
                    }
                    userId = user.userId;
                    groupId = req.params.id;
                    return [4 /*yield*/, group_1.default.findByPk(groupId)];
                case 2:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    if (group.leader === userId) {
                        return [2 /*return*/, next(new errors_1.scheduleErrors.UnauthorizedError())];
                    }
                    return [4 /*yield*/, userGroup_1.default.destroy({
                            where: {
                                userId: userId,
                                groupId: groupId,
                            },
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, res.status(204).json({ message: 'Successfully delete group user' })];
                case 4:
                    err_5 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.deleteGroupUser = deleteGroupUser;
function getGroupSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, groupId, group, queryError, _a, startDateTime, endDateTime, start, end, groupEvent, users, userEvent, event_1, err_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    error = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    groupId = req.params.id;
                    return [4 /*yield*/, group_1.default.findByPk(groupId)];
                case 1:
                    group = _b.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    queryError = (0, validators_1.validateScheduleDateScehma)(req.query).error;
                    if (queryError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    _a = req.query, startDateTime = _a.startDateTime, endDateTime = _a.endDateTime;
                    start = moment.utc(startDateTime).toDate();
                    end = moment.utc(endDateTime).toDate();
                    return [4 /*yield*/, groupSchedule_1.default.getSchedule([group.groupId], start, end)];
                case 2:
                    groupEvent = _b.sent();
                    return [4 /*yield*/, group.getUsers()];
                case 3:
                    users = (_b.sent()).map(function (user) { return user.userId; });
                    return [4 /*yield*/, personalSchedule_1.default.getSchedule(users, start, end)];
                case 4:
                    userEvent = _b.sent();
                    event_1 = {
                        nonRecurrenceSchedule: __spreadArray(__spreadArray([], userEvent.nonRecurrenceSchedule, true), groupEvent.nonRecurrenceSchedule, true),
                        recurrenceSchedule: __spreadArray(__spreadArray([], userEvent.recurrenceSchedule, true), groupEvent.recurrenceSchedule, true),
                    };
                    return [2 /*return*/, res.status(200).json(event_1)];
                case 5:
                    err_6 = _b.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.getGroupSchedule = getGroupSchedule;
function postGroupSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, _a, groupId, title, content, startDateTime, endDateTime, recurrence, freq, interval, byweekday, until, err_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    error = (0, validators_1.validateGroupScheduleSchema)(req.body).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    _a = req.body, groupId = _a.groupId, title = _a.title, content = _a.content, startDateTime = _a.startDateTime, endDateTime = _a.endDateTime, recurrence = _a.recurrence, freq = _a.freq, interval = _a.interval, byweekday = _a.byweekday, until = _a.until;
                    return [4 /*yield*/, groupSchedule_1.default.create({
                            groupId: groupId,
                            title: title,
                            content: content,
                            startDateTime: startDateTime,
                            endDateTime: endDateTime,
                            recurrence: recurrence,
                            freq: freq,
                            interval: interval,
                            byweekday: byweekday,
                            until: until,
                            possible: null,
                            impossible: null,
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/, res.status(201).json({ message: 'Successfully create group schedule' })];
                case 2:
                    err_7 = _b.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.postGroupSchedule = postGroupSchedule;
function putGroupSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var paramError, bodyError, id, schedule, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    paramError = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (paramError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    bodyError = (0, validators_1.validateGroupScheduleSchema)(req.body).error;
                    if (bodyError)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    id = req.params.id;
                    return [4 /*yield*/, groupSchedule_1.default.findOne({ where: { id: id } })];
                case 1:
                    schedule = _a.sent();
                    if (!schedule) {
                        return [2 /*return*/, next(new errors_1.scheduleErrors.ScheduleNotFoundError())];
                    }
                    return [4 /*yield*/, groupSchedule_1.default.update(req.body, { where: { id: id } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res.status(201).json({ message: 'Successfully modify group schedule' })];
                case 3:
                    err_8 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.putGroupSchedule = putGroupSchedule;
function deleteGroupSchedule(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, id, schedule, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    error = (0, validators_1.validateScheduleIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    id = req.params.id;
                    return [4 /*yield*/, groupSchedule_1.default.findOne({ where: { id: id } })];
                case 1:
                    schedule = _a.sent();
                    if (!schedule) {
                        return [2 /*return*/, next(new errors_1.scheduleErrors.ScheduleNotFoundError())];
                    }
                    return [4 /*yield*/, schedule.destroy()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res.status(204).json({ message: 'Successfully delete group schedule' })];
                case 3:
                    err_9 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.deleteGroupSchedule = deleteGroupSchedule;
function postInviteLink(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, groupId, group, characters, codeLength, inviteCode, duplicate, i, randomIndex, inviteExp, err_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    error = (0, validators_1.validateGroupIdSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    groupId = req.params.group_id;
                    return [4 /*yield*/, group_1.default.findOne({ where: { groupId: groupId } })];
                case 1:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    codeLength = 12;
                    inviteCode = '';
                    duplicate = null;
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 4];
                    inviteCode = '';
                    for (i = 0; i < codeLength; i += 1) {
                        randomIndex = Math.floor(Math.random() * characters.length);
                        inviteCode += characters.charAt(randomIndex);
                    }
                    return [4 /*yield*/, group_1.default.findOne({ where: { inviteCode: inviteCode } })];
                case 3:
                    // eslint-disable-next-line no-await-in-loop
                    duplicate = _a.sent();
                    if (!duplicate) {
                        return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 2];
                case 4:
                    inviteExp = new Date();
                    inviteExp.setDate(new Date().getDate() + 1);
                    return [4 /*yield*/, group.update({ inviteCode: inviteCode, inviteExp: inviteExp })];
                case 5:
                    _a.sent();
                    return [2 /*return*/, res.status(200).json({
                            inviteCode: inviteCode,
                            exp: inviteExp,
                        })];
                case 6:
                    err_10 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.postInviteLink = postInviteLink;
function getInvitation(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, inviteCode, group, err_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    error = (0, validators_1.validateGroupSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    inviteCode = req.params.inviteCode;
                    return [4 /*yield*/, group_1.default.findOne({ where: { inviteCode: inviteCode } })];
                case 1:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    if (group.inviteExp < new Date()) {
                        return [2 /*return*/, next(new errors_1.groupErrors.ExpiredCodeError())];
                    }
                    return [2 /*return*/, res.status(200).json({ group: group })];
                case 2:
                    err_11 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getInvitation = getInvitation;
function postGroupJoin(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var error, inviteCode, group, nickname, user, err_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    error = (0, validators_1.validateGroupSchema)(req.params).error;
                    if (error)
                        return [2 /*return*/, next(new errors_1.DataFormatError())];
                    inviteCode = req.params.inviteCode;
                    return [4 /*yield*/, group_1.default.findOne({ where: { inviteCode: inviteCode } })];
                case 1:
                    group = _a.sent();
                    if (!group) {
                        return [2 /*return*/, next(new errors_1.groupErrors.GroupNotFoundError())];
                    }
                    if (group.inviteExp < new Date()) {
                        return [2 /*return*/, next(new errors_1.groupErrors.ExpiredCodeError())];
                    }
                    nickname = req.nickname;
                    return [4 /*yield*/, user_1.default.findOne({ where: { nickname: nickname } })];
                case 2:
                    user = _a.sent();
                    return [4 /*yield*/, user.hasGroup(group)];
                case 3:
                    if (_a.sent()) {
                        return [2 /*return*/, next(new errors_1.groupErrors.InvalidGroupJoinError())];
                    }
                    return [4 /*yield*/, user.addGroup(group)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, group.update({ member: (group.member + 1) })];
                case 5:
                    _a.sent();
                    return [2 /*return*/, res.status(200).json({ message: 'Successfully joined the group.' })];
                case 6:
                    err_12 = _a.sent();
                    return [2 /*return*/, next(new apiError_1.default())];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.postGroupJoin = postGroupJoin;
