import APIError from './apiError';
import DataFormatError from './DataFormatError';
import * as authErrorsModule from './auth';
import * as calendarErrorsModule from './calendar';
import * as groupErrorsModule from './group';
import * as scheduleErrorsModule from './schedule';
import * as userErrorsModule from './user';

const authErrors = { ...authErrorsModule };
const calendarErrors = { ...calendarErrorsModule };
const groupErrors = { ...groupErrorsModule };
const scheduleErrors = { ...scheduleErrorsModule };
const userErrors = { ...userErrorsModule };

export {
  APIError,
  DataFormatError,
  authErrors,
  calendarErrors,
  groupErrors,
  scheduleErrors,
  userErrors,
};
