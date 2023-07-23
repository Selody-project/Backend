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
var groupSchedule_1 = require("./groupSchedule");
var Group = /** @class */ (function (_super) {
    __extends(Group, _super);
    function Group() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Group.initiate = function (sequelize) {
        Group.init({
            groupId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: false,
            },
            member: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            leader: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
            },
            inviteCode: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            inviteExp: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize: sequelize,
            timestamps: false,
            modelName: 'Group',
            tableName: 'groups',
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };
    Group.associate = function () {
        Group.hasMany(groupSchedule_1.default, {
            foreignKey: 'groupId',
            onDelete: 'cascade',
        });
    };
    return Group;
}(sequelize_1.Model));
exports.default = Group;
