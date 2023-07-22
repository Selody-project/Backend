"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line max-len, no-unused-vars
var apiError = function (error, req, res, next) { return res.status(error.status).json({ error: error.message }); };
exports.default = apiError;
