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
var DuplicateUserError = /** @class */ (function (_super) {
    __extends(DuplicateUserError, _super);
    function DuplicateUserError(message) {
        if (message === void 0) { message = 'User Already exists'; }
        var _this = _super.call(this, message, 409) || this;
        Object.setPrototypeOf(_this, DuplicateUserError.prototype);
        return _this;
    }
    return DuplicateUserError;
}(apiError_1.default));
exports.default = DuplicateUserError;
