import APIError from './apiError';
import DataFormatError from './DataFormatError';
import * as authErrorsModule from './auth';
import * as groupErrorsModule from './group';
import * as scheduleErrorsModule from './schedule';
import * as userErrorsModule from './user';

const authErrors = { ...authErrorsModule };
const groupErrors = { ...groupErrorsModule };
const scheduleErrors = { ...scheduleErrorsModule };
const userErrors = { ...userErrorsModule };

export {
  APIError,
  DataFormatError,
  authErrors,
  groupErrors,
  scheduleErrors,
  userErrors,
};
