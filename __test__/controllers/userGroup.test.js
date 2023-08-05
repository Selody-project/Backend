const request = require('supertest');
const app = require('../../src/app');
const {
  db, syncDB, dropDB,
  tearDownGroupDB, tearDownGroupScheduleDB, tearDownUserDB,
  setUpGroupDB, setUpGroupScheduleDB, setUpUserDB,
} = require('../dbSetup');

describe('Test /api/group endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await dropDB();
    await syncDB();
    await tearDownUserDB();
    await setUpUserDB();

    const res = await request(app).post('/api/auth/login').send({
      email: 'test-user1@email.com',
      password: 'super_strong_password',
    });
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

  describe('Test DELETE /api/user/group/:group_id', () => {
    it('Successfully delete a user from group', async () => {
      const groupId = 2;
      let res = await request(app).delete(`/api/user/group/${groupId}`).set('Cookie', cookie);
      expect(res.status).toEqual(204);
    });

    it('Successfully fail to delete a user from group (group leader cannot leave)', async () => {
      const groupId = 1;
      const res = await request(app).delete(`/api/user/group/${groupId}`).set('Cookie', cookie);
      expect(res.status).toEqual(403);
    });

    it('Successfully failed to delete user from group', async () => {
      const groupId = 100;
      const res = await request(app).delete(`/api/user/group/${groupId}`).set('Cookie', cookie);
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: 'Group Not Found' });
    });
  });
});
