"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = exports.config = void 0;
/* istanbul ignore file */
var testEnv = process.env.NODE_ENV === 'test';
var dbHost = testEnv
    ? process.env.DB_TEST_HOST
    : process.env.DB_HOST;
var dbPort = testEnv
    ? process.env.DB_TEST_PORT
    : process.env.DB_PORT;
var dbUsername = testEnv
    ? process.env.DB_TEST_USERNAME
    : process.env.DB_USERNAME;
var dbPassword = testEnv
    ? process.env.DB_TEST_PASSWORD
    : process.env.DB_PASSWORD;
var dbName = testEnv
    ? process.env.DB_TEST_NAME
    : process.env.DB_NAME;
var config = {
    APP_URL: process.env.APP_URL,
    PORT: process.env.PORT,
};
exports.config = config;
var dbConfig = {
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    host: dbHost,
    dialect: 'mysql',
    port: dbPort,
};
exports.dbConfig = dbConfig;
