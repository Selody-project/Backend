/* istanbul ignore file */
const testEnv: boolean = process.env.NODE_ENV === 'test';

const dbHost: string = testEnv
  ? process.env.DB_TEST_HOST!
  : process.env.DB_HOST!;
const dbPort: string = testEnv
  ? process.env.DB_TEST_PORT!
  : process.env.DB_PORT!;
const dbUsername: string = testEnv
  ? process.env.DB_TEST_USERNAME!
  : process.env.DB_USERNAME!;
const dbPassword: string = testEnv
  ? process.env.DB_TEST_PASSWORD!
  : process.env.DB_PASSWORD!;
const dbName = testEnv
  ? process.env.DB_TEST_NAME!
  : process.env.DB_NAME!;

const config: {
  APP_URL: string;
  APP_PORT: string,
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: 'mysql';
  port;
} = {
  APP_URL: process.env.APP_URL,
  APP_PORT: process.env.APP_PORT,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  host: dbHost,
  dialect: 'mysql',
  port: dbPort,
};

export default config;
