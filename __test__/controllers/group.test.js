const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const GroupSchedule = require('../../src/models/groupSchedule');
const {
  db, syncDB,
  tearDownGroupDB, tearDownGroupScheduleDB,
  setUpGroupScheduleDB, setUpGroupDB,
  dropDB,
} = require('../dbSetup');

describe('Test /api/group endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await syncDB();

    const mockUser = {
      userId: 1,
      email: 'testGroup1@email.com',
      nickname: 'test-group1',
      password: await bcrypt.hash('test-group-password12345', 12),
    };
    const res = await request(app).post('/api/auth/join').send(mockUser);
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
  });

  beforeEach(async () => {
    await tearDownGroupScheduleDB();
    await tearDownGroupDB();

    await setUpGroupDB();
    await setUpGroupScheduleDB();
  });

  afterEach(async () => {
    await tearDownGroupScheduleDB();
    await tearDownGroupDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test GET /api/group', () => {
    it('Group list lookup successful ', async () => {
      const res = (await request(app).get('/api/group').set('Cookie', cookie));
      const expectedGroups = {
        groupList: [{
          groupId: 1, name: 'test-group', member: 5, UserGroup: { groupId: 1, userId: 1 },
        }, {
          groupId: 2, name: 'test-group', member: 6, UserGroup: { groupId: 2, userId: 1 },
        }],
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedGroups);
    });
  });

  describe('Test POST /api/group', () => {
    it('Group creation successful ', async () => {
      const res = (await request(app).post('/api/group').set('Cookie', cookie).send({ name: 'test-group' }));
      expect(res.status).toEqual(200);
    });
  });

  describe('Test POST /api/group/calendar', () => {
    it('Group schedule creation successful ', async () => {
      const res = (await request(app).post('/api/group/calendar').set('Cookie', cookie).send({
        groupId: 1,
        title: 'test-title',
        contents: 'test-content',
        startDate: '2023-05-06',
        endDate: '2023-05-07',
        repeat: 1,
        repeatType: 'MONTH',
      }));
      expect(res.status).toEqual(201);
    });
  });

  describe('Test PUT /api/group/calendar', () => {
    it('Group Schedule Modification Successful ', async () => {
      const res = (await request(app).put('/api/group/calendar').set('Cookie', cookie).send({
        id: 1,
        groupId: 1,
        title: 'modified-title',
      }));
      const modifiedSchedule = await GroupSchedule.findOne({
        where: { title: 'modified-title' },
      });
      expect(modifiedSchedule.id).toEqual(1);
      expect(res.status).toEqual(201);
    });
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
