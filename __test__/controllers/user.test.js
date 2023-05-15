const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const {
  db, tearDownUserDB, syncDB, tearDownPersonalScheduleDB, setUpPersonalScheduleDB, dropDB,
} = require('../dbSetup');

describe('Test /api/user endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await syncDB();
    await tearDownUserDB();
    const mockUser = {
      email: 'testUser@email.com',
      nickname: 'test-user',
      password: await bcrypt.hash('test-group-password125', 12),
    };
    const res = await request(app).post('/api/auth/join').send(mockUser);
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

  describe('Test GET /api/user/:user_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const userID = 1;
      const date = '2023-04';
      const expectedSchedule = {
        schedule: [{
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-05-15T00:00:00.000Z', id: 1, month: null, repeat: 0, startDate: '2023-02-03T00:00:00.000Z', title: 'test-title', userId: 1,
        }, {
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-04-30T00:00:00.000Z', id: 2, month: null, repeat: 0, startDate: '2023-04-16T00:00:00.000Z', title: 'test-title', userId: 1,
        }, {
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-04-15T00:00:00.000Z', id: 3, month: null, repeat: 0, startDate: '2023-04-01T00:00:00.000Z', title: 'test-title', userId: 1,
        }, {
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-04-15T00:00:00.000Z', id: 5, month: null, repeat: 0, startDate: '2023-03-01T00:00:00.000Z', title: 'test-title', userId: 1,
        }, {
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-04-30T00:00:00.000Z', id: 7, month: null, repeat: 0, startDate: '2023-04-01T00:00:00.000Z', title: 'test-title', userId: 1,
        }, {
          content: 'test-content1', dayMonth: null, dayWeek: null, endDate: '2023-05-15T00:00:00.000Z', id: 8, month: null, repeat: 0, startDate: '2023-04-15T00:00:00.000Z', title: 'test-title', userId: 1,
        }],
      };
      const res = await request(app).get(`/api/user/${userID}/calendar`).set('Cookie', cookie).query({
        date,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });
});
