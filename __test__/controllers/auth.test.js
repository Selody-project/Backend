const request = require('supertest');
const app = require('../../src/app');
const {
  db, mockUser, setUpUserDB, tearDownUserDB, syncDB, dropDB,
} = require('../dbSetup');

describe('Test /auth endpoints', () => {
  beforeAll(async () => {
    await syncDB();
  });

  beforeEach(async () => {
    await tearDownUserDB();
    await setUpUserDB();
  });

  afterEach(async () => {
    await tearDownUserDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test POST /auth/join', () => {
    it('Successfully create a new user ', async () => {
      const mockBody = {
        email: 't23@email.com',
        nickname: 't3',
        password: 'sup3',
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
