"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var apiError_1 = require("../apiError");
var InvalidGroupJoinError = /** @class */ (function (_super) {
    __extends(InvalidGroupJoinError, _super);
    function InvalidGroupJoinError(message) {
        if (message === void 0) { message = 'You are already a member of this group.'; }
        var _this = _super.call(this, message, 403) || this;
        Object.setPrototypeOf(_this, InvalidGroupJoinError.prototype);
        return _this;
    }
    return InvalidGroupJoinError;
}(apiError_1.default));
exports.default = InvalidGroupJoinError;
