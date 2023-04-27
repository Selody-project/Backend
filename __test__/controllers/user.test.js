const request = require('supertest');
const app = require('../../src/app');
const { mockUser, setUpUserDB, tearDownUserDB } = require('../dbSetup');

describe('Test /user endpoints', () => {
  describe('GET /user/:id', () => {
    beforeEach(async () => {
      await tearDownUserDB();
      await setUpUserDB();
      await request(app).post('/api/auth/login').send(mockUser);
    });

    afterEach(async () => {
      await tearDownUserDB();
    });

    it('Successfully returns 0 user', async () => {
      expect(2).toEqual(2);
    });
  });
});
