const request = require('supertest');
const app = require('../../src/app');
const {
  db,
  tearDownUserDB,
  setUpUserDB,
  syncDB,
  tearDownPersonalScheduleDB,
  setUpPersonalScheduleDB,
  dropDB,
} = require('../dbSetup');
const PersonalSchedule = require('../../src/models/personalSchedule');

describe('Test /api/user endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await dropDB();
    await syncDB();
    await tearDownPersonalScheduleDB();
    await tearDownUserDB();
    await setUpUserDB();
    await setUpPersonalScheduleDB();

    const res = await request(app).post('/api/auth/login').send({
      email: 'test-user@email.com',
      password: 'super_strong_password',
    });
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
  });

  beforeEach(async () => {
    await tearDownPersonalScheduleDB();
    await setUpPersonalScheduleDB();
  });

  afterEach(async () => {
    await tearDownPersonalScheduleDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test PUT /api/user/profile', () => {
    it('Successfully modified user profile ', async () => {
      const newNickname = "newNickname";
      const newPassword = "newPassword";
      const res1 = await request(app).put('/api/user/profile').set('Cookie', cookie).send({
        nickname: newNickname,
        password: newPassword
      });
      cookie = res1.headers['set-cookie'][0];
      expect(res1.status).toEqual(200);

      const res2 = await request(app).get('/api/auth/token/verify').set('Cookie', cookie).send();
      const comparePassword = await bcrypt.compare(newPassword, res2.body.exUser.password);
      delete res2.body.exUser.createdAt;
      delete res2.body.exUser.deletedAt;
      delete res2.body.exUser.updatedAt;
      delete res2.body.exUser.password;
      const expectedProfile = {
        "exUser": {
          "email": "test-user@email.com",
          "nickname": newNickname,
          "provider": "local",
          "snsId": null,
          "userId": 1,
        },
      };
      expect(comparePassword).toEqual(true);
      expect(res2.status).toEqual(200);
      expect(res2.body).toEqual(expectedProfile);
    });
  });

  describe('Test GET /api/user/:user_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const userID = 1;
      const date = '2023-04';
      const expectedSchedule = {
        nonRecurrenceSchedule: [
          {
            content: 'test-content1', endDateTime: '2023-05-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-02-03T00:00:00.000Z', title: 'test-title1',
          },
          {
            content: 'test-content2', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-15T00:00:00.000Z', title: 'test-title2',
          },
          {
            content: 'test-content3', endDateTime: '2023-04-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-10T00:00:00.000Z', title: 'test-title3',
          },
          {
            content: 'test-content4', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-01T00:00:00.000Z', title: 'test-title4',
          },
          {
            content: 'test-content5', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-03-15T00:00:00.000Z', title: 'test-title5',
          },
          {
            content: 'test-content6', endDateTime: '2023-05-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-15T00:00:00.000Z', title: 'test-title6',
          },
          {
            content: 'test-content9', endDateTime: '2023-04-01T08:59:59.000Z', recurrence: 0, startDateTime: '2023-03-15T00:00:00.000Z', title: 'test-title9',
          },
          {
            content: 'test-content10', endDateTime: '2023-05-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-30T23:59:59.000Z', title: 'test-title10',
          },
        ],
        recurrenceSchedule: [
          {
            byweekday: '',
            content: 'test-content11',
            freq: 'DAILY',
            id: 11,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-01T13:00:00.000Z', startDateTime: '2023-04-01T12:00:00.000Z' },
              { endDateTime: '2023-04-02T13:00:00.000Z', startDateTime: '2023-04-02T12:00:00.000Z' },
              { endDateTime: '2023-04-03T13:00:00.000Z', startDateTime: '2023-04-03T12:00:00.000Z' },
              { endDateTime: '2023-04-04T13:00:00.000Z', startDateTime: '2023-04-04T12:00:00.000Z' },
              { endDateTime: '2023-04-05T13:00:00.000Z', startDateTime: '2023-04-05T12:00:00.000Z' },
            ],
            title: 'test-title11',
            until: '2023-04-05T14:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content12',
            freq: 'MONTHLY',
            id: 12,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title12',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content13',
            freq: 'WEEKLY',
            id: 13,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-05T13:00:00.000Z', startDateTime: '2023-04-05T12:00:00.000Z' },
              { endDateTime: '2023-04-12T13:00:00.000Z', startDateTime: '2023-04-12T12:00:00.000Z' },
              { endDateTime: '2023-04-19T13:00:00.000Z', startDateTime: '2023-04-19T12:00:00.000Z' },
              { endDateTime: '2023-04-26T13:00:00.000Z', startDateTime: '2023-04-26T12:00:00.000Z' },
            ],
            title: 'test-title13',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content14',
            freq: 'YEARLY',
            id: 14,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title14',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: 'MO,TU',
            content: 'test-content15',
            freq: 'DAILY',
            id: 15,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-03T13:00:00.000Z', startDateTime: '2023-04-03T12:00:00.000Z' },
              { endDateTime: '2023-04-04T13:00:00.000Z', startDateTime: '2023-04-04T12:00:00.000Z' },
              { endDateTime: '2023-04-10T13:00:00.000Z', startDateTime: '2023-04-10T12:00:00.000Z' },
              { endDateTime: '2023-04-11T13:00:00.000Z', startDateTime: '2023-04-11T12:00:00.000Z' },
              { endDateTime: '2023-04-17T13:00:00.000Z', startDateTime: '2023-04-17T12:00:00.000Z' },
              { endDateTime: '2023-04-18T13:00:00.000Z', startDateTime: '2023-04-18T12:00:00.000Z' },
              { endDateTime: '2023-04-24T13:00:00.000Z', startDateTime: '2023-04-24T12:00:00.000Z' },
              { endDateTime: '2023-04-25T13:00:00.000Z', startDateTime: '2023-04-25T12:00:00.000Z' },
            ],
            title: 'test-title15',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content16',
            freq: 'DAILY',
            id: 16,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-02T00:00:00.000Z', startDateTime: '2023-03-16T12:00:00.000Z' },
              { endDateTime: '2023-04-03T00:00:00.000Z', startDateTime: '2023-03-17T12:00:00.000Z' },
              { endDateTime: '2023-04-04T00:00:00.000Z', startDateTime: '2023-03-18T12:00:00.000Z' },
              { endDateTime: '2023-04-05T00:00:00.000Z', startDateTime: '2023-03-19T12:00:00.000Z' },
            ],
            title: 'test-title16',
            until: '2023-03-20T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content17',
            freq: 'WEEKLY',
            id: 17,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-05T00:00:00.000Z', startDateTime: '2023-03-19T12:00:00.000Z' },
              { endDateTime: '2023-04-12T00:00:00.000Z', startDateTime: '2023-03-26T12:00:00.000Z' },
              { endDateTime: '2023-04-19T00:00:00.000Z', startDateTime: '2023-04-02T12:00:00.000Z' },
              { endDateTime: '2023-04-26T00:00:00.000Z', startDateTime: '2023-04-09T12:00:00.000Z' },
              { endDateTime: '2023-05-03T00:00:00.000Z', startDateTime: '2023-04-16T12:00:00.000Z' },
              { endDateTime: '2023-05-10T00:00:00.000Z', startDateTime: '2023-04-23T12:00:00.000Z' },
              { endDateTime: '2023-05-17T00:00:00.000Z', startDateTime: '2023-04-30T12:00:00.000Z' },
            ],
            title: 'test-title17',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content18',
            freq: 'MONTHLY',
            id: 18,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-05-02T00:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title18',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content19',
            freq: 'YEARLY',
            id: 19,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-02T00:00:00.000Z', startDateTime: '2023-01-15T12:00:00.000Z' },
            ],
            title: 'test-title19',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content21',
            freq: 'MONTHLY',
            id: 21,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-05-01T23:59:59.000Z', startDateTime: '2023-04-30T23:59:59.000Z' },
            ],
            title: 'test-title21',
            until: '2025-01-01T00:00:00.000Z',
          },
        ],
      };
      const res = await request(app).get(`/api/user/${userID}/calendar`).set('Cookie', cookie).query({
        date,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });

  describe('Test GET /api/user/:user_id/calendar/todo', () => {
    it('Successfully get an April Schedule ', async () => {
      const userID = 1;
      const date = '2023-04-15';
      const expectedSchedule = {
        nonRecurrenceSchedule: [
          {
            content: 'test-content1', endDateTime: '2023-05-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-02-03T00:00:00.000Z', title: 'test-title1',
          },
          {
            content: 'test-content2', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-15T00:00:00.000Z', title: 'test-title2',
          },
          {
            content: 'test-content3', endDateTime: '2023-04-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-10T00:00:00.000Z', title: 'test-title3',
          },
          {
            content: 'test-content4', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-01T00:00:00.000Z', title: 'test-title4',
          },
          {
            content: 'test-content5', endDateTime: '2023-04-30T23:59:59.000Z', recurrence: 0, startDateTime: '2023-03-15T00:00:00.000Z', title: 'test-title5',
          },
          {
            content: 'test-content6', endDateTime: '2023-05-15T23:59:59.000Z', recurrence: 0, startDateTime: '2023-04-15T00:00:00.000Z', title: 'test-title6',
          },
        ],
        recurrenceSchedule: [
          {
            byweekday: '',
            content: 'test-content12',
            freq: 'MONTHLY',
            id: 12,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title12',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content14',
            freq: 'YEARLY',
            id: 14,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title14',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content17',
            freq: 'WEEKLY',
            id: 17,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-04-19T00:00:00.000Z', startDateTime: '2023-04-02T12:00:00.000Z' },
              { endDateTime: '2023-04-26T00:00:00.000Z', startDateTime: '2023-04-09T12:00:00.000Z' },
            ],
            title: 'test-title17',
            until: '2025-01-01T00:00:00.000Z',
          },
          {
            byweekday: '',
            content: 'test-content18',
            freq: 'MONTHLY',
            id: 18,
            interval: 1,
            recurrence: 1,
            recurrenceDateList: [
              { endDateTime: '2023-05-02T00:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
            ],
            title: 'test-title18',
            until: '2025-01-01T00:00:00.000Z',
          },
        ],
      };
      const res = await request(app).get(`/api/user/${userID}/calendar/todo`).set('Cookie', cookie).query({
        date,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });

  describe('Test PUT /api/user/calendar', () => {
    it('Successfully modified user schedule ', async () => {
      const res = await request(app).put('/api/user/calendar').set('Cookie', cookie).send({
        id: 1,
        title: 'modified-title',
      });
      const modifiedSchedule = await PersonalSchedule.findOne({
        where: { title: 'modified-title' },
      });
      expect(res.status).toEqual(201);
      expect(modifiedSchedule.id).toEqual(1);
    });
  });
});
