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
    port: dbConfig.port,
    options: {
      database: dbConfig.database,
      timezone: dbConfig.timezone,
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
    // eslint-disable-next-line no-console
    logging: process.env.NODE_ENV == 'test' ? false : console.log(),
  },
);

db.sequelize = sequelize;

const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
    model.initiate(sequelize);
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = {
  db,
  sequelize,
};
