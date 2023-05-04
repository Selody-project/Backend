const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const {
  db, syncDB, 
  tearDownUserDB, tearDownGroupDB, tearDownGroupScheduleDB,
  setUpGroupScheduleDB, setUpGroupDB,
  dropDB, 
} = require('../dbSetup');

describe('Test /api/group endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await syncDB();
  });

  beforeEach(async () => {
    const mockUser = {
      email: 'testGroup@email.com',
      nickname: 'test-group',
      password: await bcrypt.hash('test-group-password12345', 12),
    };

    await tearDownGroupScheduleDB();
    await tearDownUserDB();
    await tearDownGroupDB();
    await setUpGroupDB();
    await setUpGroupScheduleDB();
    const res = await request(app).post('/api/auth/join').send(mockUser);
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
  });

  afterEach(async () => {
    await tearDownGroupScheduleDB();
    await tearDownGroupDB();
    await tearDownUserDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test GET /api/group/:group_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const groupID = 1;
      const date = '2023-04';
      const expectedSchedule = {
        schedule: [{
          confirmed: 0, content: 'test-content', endDate: '2023-05-15T00:00:00.000Z', groupId: 1, id: 1, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-02-03T00:00:00.000Z', title: 'test-title',
        }, {
          confirmed: 0, content: 'test-content', endDate: '2023-04-30T00:00:00.000Z', groupId: 1, id: 2, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-04-16T00:00:00.000Z', title: 'test-title',
        }, {
          confirmed: 0, content: 'test-content', endDate: '2023-04-15T00:00:00.000Z', groupId: 1, id: 3, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-04-01T00:00:00.000Z', title: 'test-title',
        }, {
          confirmed: 0, content: 'test-content', endDate: '2023-04-30T00:00:00.000Z', groupId: 1, id: 5, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-04-01T00:00:00.000Z', title: 'test-title',
        }, {
          confirmed: 0, content: 'test-content', endDate: '2023-04-15T00:00:00.000Z', groupId: 1, id: 6, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-03-01T00:00:00.000Z', title: 'test-title',
        }, {
          confirmed: 0, content: 'test-content', endDate: '2023-05-15T00:00:00.000Z', groupId: 1, id: 8, impossible: '["user3"]', possible: '["user1"]', repeat: 1, repeatType: 'YEAR', startDate: '2023-04-15T00:00:00.000Z', title: 'test-title',
        }],
      };
      const res = await request(app).get(`/api/group/${groupID}/calendar`).set('Cookie', cookie).query({
        date,
      });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });
});
