"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userErrors = exports.scheduleErrors = exports.groupErrors = exports.calendarErrors = exports.authErrors = exports.DataFormatError = exports.APIError = void 0;
var apiError_1 = require("./apiError");
exports.APIError = apiError_1.default;
var DataFormatError_1 = require("./DataFormatError");
exports.DataFormatError = DataFormatError_1.default;
var authErrorsModule = require("./auth");
var calendarErrorsModule = require("./calendar");
var groupErrorsModule = require("./group");
var scheduleErrorsModule = require("./schedule");
var userErrorsModule = require("./user");
var authErrors = __assign({}, authErrorsModule);
exports.authErrors = authErrors;
var calendarErrors = __assign({}, calendarErrorsModule);
exports.calendarErrors = calendarErrors;
var groupErrors = __assign({}, groupErrorsModule);
exports.groupErrors = groupErrors;
var scheduleErrors = __assign({}, scheduleErrorsModule);
exports.scheduleErrors = scheduleErrors;
var userErrors = __assign({}, userErrorsModule);
exports.userErrors = userErrors;
