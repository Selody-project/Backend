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
var NotNullValidationError = /** @class */ (function (_super) {
    __extends(NotNullValidationError, _super);
    function NotNullValidationError(message) {
        if (message === void 0) { message = 'Not Null Validation'; }
        var _this = _super.call(this, message, 400) || this;
        Object.setPrototypeOf(_this, NotNullValidationError.prototype);
        return _this;
    }
    return NotNullValidationError;
}(apiError_1.default));
exports.default = NotNullValidationError;
