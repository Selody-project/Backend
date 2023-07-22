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
var apiError_1 = require("./apiError");
var DataFormatError = /** @class */ (function (_super) {
    __extends(DataFormatError, _super);
    function DataFormatError(message) {
        if (message === void 0) { message = 'The requested data format is not valid.'; }
        var _this = _super.call(this, message, 400) || this;
        Object.setPrototypeOf(_this, DataFormatError.prototype);
        return _this;
    }
    return DataFormatError;
}(apiError_1.default));
exports.default = DataFormatError;
