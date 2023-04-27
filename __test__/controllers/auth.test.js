const request = require('supertest');
const app = require('../../src/app');
const {
  mockUser, setUpUserDB, tearDownUserDB, syncDB,
} = require('../dbSetup');

describe('Test /auth endpoints', () => {
  describe('Test POST /auth/join', () => {
    beforeAll(async () => {
      await syncDB();
      await tearDownUserDB();
      await setUpUserDB();
    });

    beforeEach(async () => {
      await tearDownUserDB();
      await setUpUserDB();
    });

    afterAll(async () => {
      await tearDownUserDB();
    });

    // it('Successfully create a new user ', async () => {
    //   const mockBody = {
    //     email: 'test-user2@email.com',
    //     nickname: 'test-user2',
    //     password: 'super_strong_password',
    //   };

    //   const response = await request(app).post('/api/auth/join').send(mockBody);
    //   expect(response.status).toEqual(200);
    // });

    it('Failed to create a new user (already existing email) ', async () => {
      const response = await request(app).post('/api/auth/join').send(mockUser);
      expect(response.status).toEqual(409);
    });
  });
});
