const request = require('supertest');
const app = require('../../src/app');
const {
  db, mockUser, setUpUserDB, tearDownUserDB, syncDB, dropDB,
} = require('../dbSetup');

// ./utils/cron.js 모듈을 모킹합니다.
jest.mock('../../src/utils/cron', () => {
  return {
    // 모듈 내부의 함수나 객체를 모킹합니다.
    start: jest.fn(), // start 함수를 스파이 함수로 대체
  };
});

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