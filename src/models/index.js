const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const { dbConfig } = require('../config/config');

const db = {};

const sequelize = new Sequelize(
  dbConfig.database, dbConfig.username, dbConfig.password,
  {
    host: dbConfig.host,
    dialect: 'mysql',
  },
);

db.sequelize = sequelize;

const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    console.log(__dirname);
    console.log(file);
    const model = require(path.join(__dirname, file));
    // console.log(file, model.name);
    db[model.name] = model;
    model.initiate(sequelize);
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
