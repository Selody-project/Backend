"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.db = void 0;
var sequelize_1 = require("sequelize");
var config_1 = require("../config/config");
var user_1 = require("./user");
var group_1 = require("./group");
var personalSchedule_1 = require("./personalSchedule");
var groupSchedule_1 = require("./groupSchedule");
var userGroup_1 = require("./userGroup");
var db = {};
exports.db = db;
var sequelize = new sequelize_1.Sequelize(config_1.dbConfig.database, config_1.dbConfig.username, config_1.dbConfig.password, {
    host: config_1.dbConfig.host,
    dialect: 'mysql',
    port: config_1.dbConfig.port,
    pool: {
        max: 5,
        min: 0,
        idle: 10000,
    },
    logging: false,
    // eslint-disable-next-line no-console
    //logging: process.env.NODE_ENV == 'test' ? false : console.log,
});
exports.sequelize = sequelize;
db.sequelize = sequelize;
db['User'] = user_1.default;
db['Group'] = group_1.default;
db['PersonalSchedule'] = personalSchedule_1.default;
db['GroupSchedule'] = groupSchedule_1.default;
db['UserGroup'] = userGroup_1.default;
user_1.default.initiate(sequelize);
group_1.default.initiate(sequelize);
personalSchedule_1.default.initiate(sequelize);
groupSchedule_1.default.initiate(sequelize);
userGroup_1.default.initiate(sequelize);
/*
const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
    model.initiate(sequelize);
  });
*/
Object.keys(db).forEach(function (modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
