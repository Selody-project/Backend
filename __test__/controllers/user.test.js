const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const {
  db, tearDownUserDB, syncDB, tearDownPersonalScheduleDB, setUpPersonalScheduleDB, dropDB,
} = require('../dbSetup');
const PersonalSchedule = require('../../src/models/personalSchedule');

describe('Test /api/user endpoints', () => {
  let token;
  beforeAll(async () => {
    await syncDB();
    await tearDownUserDB();
    const mockUser = {
      userId: 1,
      email: 'testUser@email.com',
      nickname: 'test-user',
      password: await bcrypt.hash('test-group-password125', 12),
    };
    const res = await request(app).post('/api/auth/join').send(mockUser);
    // eslint-disable-next-line prefer-destructuring
    token = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
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

  describe('Test POST /api/user/calendar', () => {
    it('Schedule creation successful ', async () => {
      const res = (await request(app).post('/api/user/calendar').set('Authorization', `Bearer ${token}`).send({
        userId: 1, 
        title: 'test-title', 
        content: 'test-content1', 
        startDate: '6000-01-01 00:00:00.000000', 
        endDate: '7000-01-01 00:00:00.000000', 
        repeat: 0, 
        repeatType: '1',
      }));
      expect(res.statusCode).toEqual(201);
    });
  });

  describe('Test GET /api/user/:user_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const userID = 1;
      const date = '2023-04';
      const expectedSchedule = {
        schedule: [
          {
            id: 1,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-02-03T00:00:00.000Z',
            endDate: '2023-05-15T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
          {
            id: 2,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-04-16T00:00:00.000Z',
            endDate: '2023-04-30T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
          {
            id: 3,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-04-01T00:00:00.000Z',
            endDate: '2023-04-15T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
          {
            id: 5,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-03-01T00:00:00.000Z',
            endDate: '2023-04-15T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
          {
            id: 7,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-04-01T00:00:00.000Z',
            endDate: '2023-04-30T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
          {
            id: 8,
            title: 'test-title',
            content: 'test-content1',
            startDate: '2023-04-15T00:00:00.000Z',
            endDate: '2023-05-15T00:00:00.000Z',
            repeat: false,
            repeatType: 'YEAR',
            userId: 1,
          },
        ],
      };
      const res = await request(app).get(`/api/user/${userID}/calendar`).set('Authorization', `Bearer ${token}`).query({
        date,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });
});
