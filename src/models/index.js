"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.UserGroup = exports.GroupSchedule = exports.PersonalSchedule = exports.Group = exports.User = void 0;
var sequelize_1 = require("sequelize");
var config_1 = require("../config/config");
var user_1 = require("./user");
exports.User = user_1.default;
var group_1 = require("./group");
exports.Group = group_1.default;
var personalSchedule_1 = require("./personalSchedule");
exports.PersonalSchedule = personalSchedule_1.default;
var groupSchedule_1 = require("./groupSchedule");
exports.GroupSchedule = groupSchedule_1.default;
var userGroup_1 = require("./userGroup");
exports.UserGroup = userGroup_1.default;
var sequelize = new sequelize_1.Sequelize(config_1.default.database, config_1.default.username, config_1.default.password, {
    host: config_1.default.host,
    dialect: 'mysql',
    port: config_1.default.port,
    pool: {
        max: 5,
        min: 0,
        idle: 10000,
    },
    logging: false,
    // eslint-disable-next-line no-console
    // logging: process.env.NODE_ENV == 'test' ? false : console.log,
});
exports.sequelize = sequelize;
user_1.default.initiate(sequelize);
group_1.default.initiate(sequelize);
personalSchedule_1.default.initiate(sequelize);
groupSchedule_1.default.initiate(sequelize);
userGroup_1.default.initiate(sequelize);
user_1.default.associate();
group_1.default.associate();
personalSchedule_1.default.associate();
groupSchedule_1.default.associate();
userGroup_1.default.associate();
