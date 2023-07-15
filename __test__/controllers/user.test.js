const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const {
  db, syncDB, dropDB,
  setUpUserDB, setUpPersonalScheduleDB,
  tearDownUserDB, tearDownPersonalScheduleDB, setUpGroupScheduleDB2, tearDownGroupScheduleDB,
  tearDownGroupDB, setUpGroupDB,
} = require('../dbSetup');
const PersonalSchedule = require('../../src/models/personalSchedule');
const User = require('../../src/models/user');

describe('Test /api/user endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await dropDB();
    await syncDB();

    await tearDownPersonalScheduleDB();
    await tearDownGroupScheduleDB();
    await tearDownUserDB();
    await tearDownGroupDB();

    await setUpUserDB();
    await setUpGroupDB();
    await setUpPersonalScheduleDB();
    await setUpGroupScheduleDB2();

    const res = await request(app).post('/api/auth/login').send({
      email: 'test-user1@email.com',
      password: 'super_strong_password',
    });
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
  });

  beforeEach(async () => {
    await tearDownPersonalScheduleDB();
    await tearDownGroupScheduleDB();
    await tearDownUserDB();
    await tearDownGroupDB();

    await setUpUserDB();
    await setUpGroupDB();
    await setUpPersonalScheduleDB();
    await setUpGroupScheduleDB2();
  });

  afterEach(async () => {
    await tearDownPersonalScheduleDB();
    await tearDownGroupScheduleDB();
    await tearDownUserDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test PATCH /api/user/profile', () => {
    it('Successfully modified user profile ', async () => {
      const newNickname = 'newNickname';
      let res = await request(app).patch('/api/user/profile').set('Cookie', cookie).send({
        nickname: newNickname,
      });

      // eslint-disable-next-line prefer-destructuring
      const newCookie = res.headers['set-cookie'][0];
      expect(res.status).toEqual(200);

      res = await request(app).get('/api/auth/token/verify').set('Cookie', newCookie).send();
      delete res.body.user.createdAt;
      delete res.body.user.deletedAt;
      delete res.body.user.updatedAt;
      delete res.body.user.password;

      const expectedProfile = {
        user: {
          email: 'test-user1@email.com',
          eventNotification: 1,
          nickname: newNickname,
          provider: 'local',
          sharePersonalEvent: 1,
          snsId: null,
          userId: 1,
        },
      };

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedProfile);
    });
  });

  describe('Test PATCH /api/user/profile/password', () => {
    it('Successfully modified user password ', async () => {
      const newPassword = 'newPassword';
      let res = await request(app).patch('/api/user/profile/password').set('Cookie', cookie).send({
        password: newPassword,
      });

      expect(res.status).toEqual(200);

      res = await request(app).get('/api/auth/token/verify').set('Cookie', cookie).send();
      const comparePassword = await bcrypt.compare(newPassword, res.body.user.password);

      expect(comparePassword).toEqual(true);
      expect(res.status).toEqual(200);
    });
  });

  describe('Test GET /api/user/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const startDateTime = '2023-04-01T00:00:00.000Z';
      const endDateTime = '2023-04-30T23:59:59.999Z';
      const expectedSchedule = {
        nonRecurrenceSchedule: [
          {
            id: 1,
            isGroup: 0,
            content: 'test-content1',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-02-03T00:00:00.000Z',
            title: 'test-title1',
          },
          {
            id: 2,
            isGroup: 0,
            content: 'test-content2',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-15T00:00:00.000Z',
            title: 'test-title2',
          },
          {
            id: 3,
            isGroup: 0,
            content: 'test-content3',
            endDateTime: '2023-04-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-10T00:00:00.000Z',
            title: 'test-title3',
          },
          {
            id: 4,
            isGroup: 0,
            content: 'test-content4',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-01T00:00:00.000Z',
            title: 'test-title4',
          },
          {
            id: 5,
            isGroup: 0,
            content: 'test-content5',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-03-15T00:00:00.000Z',
            title: 'test-title5',
          },
          {
            id: 6,
            isGroup: 0,
            content: 'test-content6',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-15T00:00:00.000Z',
            title: 'test-title6',
          },
          {
            id: 9,
            isGroup: 0,
            content: 'test-content9',
            endDateTime: '2023-04-01T08:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-03-15T00:00:00.000Z',
            title: 'test-title9',
          },
          {
            id: 10,
            isGroup: 0,
            content: 'test-content10',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-30T23:59:59.000Z',
            title: 'test-title10',
          },
          {
            id: 1,
            isGroup: 1,
            content: 'test-content1',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-02-03T00:00:00.000Z',
            title: 'test-title1',
          },
          {
            id: 2,
            isGroup: 1,
            content: 'test-content2',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-15T00:00:00.000Z',
            title: 'test-title2',
          },
          {
            id: 3,
            isGroup: 1,
            content: 'test-content3',
            endDateTime: '2023-04-15T23:59:59.000Z',
            recurrence: 0,
            startDateTime: '2023-04-10T00:00:00.000Z',
            title: 'test-title3',
          },
        ],
        recurrenceSchedule: [
          {
            byweekday: '',
            content: 'test-content11',
            freq: 'DAILY',
            id: 11,
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
            isGroup: 0,
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
      const res = await request(app).get('/api/user/calendar').set('Cookie', cookie).query({
        startDateTime,
        endDateTime,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });

  describe('Test PUT /api/user/calendar/:id', () => {
    it('Successfully modified user schedule ', async () => {
      const id = 1;
      const res = await request(app).put(`/api/user/calendar/${id}`).set('Cookie', cookie).send({
        title: 'modified-title',
      });
      const modifiedSchedule = await PersonalSchedule.findOne({
        where: { title: 'modified-title' },
      });
      expect(res.status).toEqual(201);
      expect(modifiedSchedule.id).toEqual(1);
    });

    it('Successfully fail to modified user schedule (long name)', async () => {
      const id = 1;
      const res = await request(app).put(`/api/user/calendar/${id}`).set('Cookie', cookie).send({
        title: 'very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-name',
      });
      expect(res.status).toEqual(400);
    });
  });

  describe('Test POST /api/user/calendar', () => {
    it('Successfully insert a user schedule into the database (non-recurrence)', async () => {
      const schedule = {
        title: 'test-title',
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 0,
      };

      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      expect(res.statusCode).toEqual(201);
    });

    it('Successfully insert a user schedule into the database (recurrence)', async () => {
      const schedule = {
        title: 'test-title',
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 1,
        freq: 'WEEKLY',
        interval: 1,
        byweekday: 'MO',
        until: '2026-01-05',
      };
      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      expect(res.statusCode).toEqual(201);
    });

    it('Successfully fail to insert a user schedule into the database (Incorrect Data format)', async () => {
      const schedule = {
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 0,
      };
      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'The requested data format is not valid.' });
    });
  });

  describe('Test DELETE /api/user/calendar', () => {
    it('Successfully delete a User schedule from the database ', async () => {
      const id = 9;
      const res = await request(app).delete(`/api/user/calendar/${id}`).set('Cookie', cookie);
      expect(res.statusCode).toEqual(204);
    });

    it('Successfully fail to delete a User schedule from the database (non-existent schedule)', async () => {
      const id = 10000;
      const res = await request(app).delete(`/api/user/calendar/${id}`).set('Cookie', cookie);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Not Found data' });
    });
  });

  describe('Test DELETE /api/withdrawal', () => {
    it('Successfully delete a user from user table', async () => {
      const id = 4;
      const res = await request(app).delete(`/api/withdrawal/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(204);
    });

    it('Successfully fail to delete a user from user table (UserIsLeader Error)', async () => {
      const id = 1;
      const res = await request(app).delete(`/api/withdrawal/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(499);
    });
  });

  // describe('Test POST /api/userSetup', () => {
  //   it('Successfully update eventNotification and sharePersoanlEvent from user table',
  // async () => {
  //     const result = {
  //       eventNotification: 0,
  //       content: 1,
  //     };
  //     const res = await request(app).post('/api/userSetup').set('Cookie', cookie).send(result);
  //     expect(res.status).toEqual(204);
  //   });
  // });
  describe('Test PATCH /api/user/updateUserSetup', () => {
    it('Successfully update eventNotification and sharePersoanlEvent from user table', async () => {
      const id = 1;
      const result = {
        eventNotification: 0,
        sharePersonalEvent: 1,
      };
      const res = await request(app).patch(`/api/user/userSetup/${id}`).set('Cookie', cookie).send(result);

      const user = await User.findByPk(id);

      expect(res.status).toEqual(200);
      expect(user.eventNotification).toEqual(0);
      expect(user.sharePersonalEvent).toEqual(1);
    });

    it('Successfully fail to update user Setup from user table', async () => {
      const id = 100;
      const result = {
        eventNotification: 0,
        sharePersonalEvent: 1,
      };
      const res = await request(app).patch(`/api/user/userSetup/${id}`).set('Cookie', cookie).send(result);

      expect(res.status).toEqual(404);
    });
  });
});
