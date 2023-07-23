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
var sequelize_1 = require("sequelize");
var user_1 = require("./user");
var group_1 = require("./group");
var UserGroup = /** @class */ (function (_super) {
    __extends(UserGroup, _super);
    function UserGroup() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UserGroup.initiate = function (sequelize) {
        UserGroup.init({}, {
            sequelize: sequelize,
            modelName: 'UserGroup',
            tableName: 'UserGroup',
            timestamps: false,
        });
    };
    UserGroup.associate = function () {
        user_1.default.belongsToMany(group_1.default, {
            through: 'UserGroup',
            foreignKey: 'userId',
            timestamps: false,
        });
        group_1.default.belongsToMany(user_1.default, {
            through: 'UserGroup',
            foreignKey: 'groupId',
            timestamps: false,
        });
    };
    return UserGroup;
}(sequelize_1.Model));
exports.default = UserGroup;
