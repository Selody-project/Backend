/* istanbul ignore file */

const testEnv = process.env.NODE_ENV === 'test';
const dbHost = testEnv ? process.env.DB_TEST_HOST : process.env.DB_HOST;
const dbPort = testEnv ? process.env.DB_TEST_PORT : process.env.DB_PORT;
const dbUsername = testEnv
  ? process.env.DB_TEST_USERNAME
  : process.env.DB_USERNAME;
const dbPassword = testEnv
  ? process.env.DB_TEST_PASSWORD
  : process.env.DB_PASSWORD;
const dbName = testEnv ? process.env.DB_TEST_NAME : process.env.DB_NAME;

const config = {
  APP_URL: process.env.APP_URL,
  PORT: process.env.PORT,
};

const dbConfig = {
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  host: dbHost,
  dialect: 'mysql',
  port: dbPort,
  timezone: '+00:00',
};

module.exports = {
  config,
  dbConfig,
};
