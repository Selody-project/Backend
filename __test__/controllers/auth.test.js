const request = require('supertest');
const app = require('../../src/app');
const {
  db, mockUser, setUpUserDB, tearDownUserDB, syncDB, dropDB,
} = require('../dbSetup');

describe('Test /auth endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await syncDB();
    await tearDownUserDB();
  });

  beforeEach(async () => {
    await setUpUserDB();

    const res = await request(app).post('/api/auth/login').send({
      email: 'test-user1@email.com',
      password: 'super_strong_password',
    });
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
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

  describe('Test POST /auth/login', () => {
    it('Login Failed ', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'wrong-user@email.com',
        password: 'wrong_password',
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('Test DELETE /auth/logout', () => {
    it('Logout Successful ', async () => {
      const response = await request(app).delete('/api/auth/logout').set('Cookie', cookie);
      expect(response.status).toEqual(200);
    });
  });
});