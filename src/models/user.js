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
var personalSchedule_1 = require("./personalSchedule");
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    User.initiate = function (sequelize) {
        User.init({
            userId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            email: {
                type: sequelize_1.DataTypes.STRING(40),
                allowNull: true,
                unique: true,
            },
            nickname: {
                type: sequelize_1.DataTypes.STRING(15),
                allowNull: false,
            },
            password: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            provider: {
                type: sequelize_1.DataTypes.ENUM('local', 'naver', 'google'),
                allowNull: false,
                defaultValue: 'local',
            },
            snsId: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
        }, {
            sequelize: sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };
    User.associate = function () {
        User.hasMany(personalSchedule_1.default, {
            foreignKey: 'userId',
            onDelete: 'cascade',
        });
    };
    return User;
}(sequelize_1.Model));
exports.default = User;
