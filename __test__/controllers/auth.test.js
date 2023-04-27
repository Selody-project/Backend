const request = require('supertest');
const app = require('../../src/app');
const { mockUser, setUpUserDB, tearDownUserDB } = require('../dbSetup');

describe('Test /auth endpoints', () => {
  describe('Test POST /auth/join', () => {
    beforeAll(async () => {
      await tearDownUserDB();
      await setUpUserDB();
    });

    afterAll(async () => {
      await tearDownUserDB();
    });

    it('Successfully create a new user ', async () => {
      const mockBody = {
        email: 'test-user1@email.com',
        nickname: 'test-user',
        password: 'super_strong_password',
      };

      const response = await request(app).post('/api/auth/join').send(mockBody);
      expect(response.status).toEqual(200);
    });

    it('Failed to create a new user (already existing email) ', async () => {
      const response = await request(app).post('/api/auth/join').send(mockUser);
      expect(response.status).toEqual(409);
    });
  });
});
