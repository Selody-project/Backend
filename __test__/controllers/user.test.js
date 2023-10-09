const request = require('supertest');
const app = require('../../src/app');
const {
  db, syncDB, dropDB,
  setUpUserDB, setUpPersonalScheduleDB,
  tearDownUserDB, tearDownPersonalScheduleDB, setUpGroupScheduleDB2, tearDownGroupScheduleDB,
  tearDownGroupDB, setUpGroupDB, setUpGroupPostDB, tearDownGroupPostDB, setUpLikeDB, tearDownLikeDB,
} = require('../dbSetup');
const PersonalSchedule = require('../../src/models/personalSchedule');

// ./utils/cron.js 모듈을 모킹합니다.
jest.mock('../../src/utils/cron', () => {
  return {
    // 모듈 내부의 함수나 객체를 모킹합니다.
    start: jest.fn(), // start 함수를 스파이 함수로 대체
  };
});


describe('Test /api/user endpoints', () => {
  let cookie;
  beforeAll(async () => {
    await dropDB();
    await syncDB();
    await setUpUserDB();

    const res = await request(app).post('/api/auth/login').send({
      email: 'test-user1@email.com',
      password: 'super_strong_password',
    });
    // eslint-disable-next-line prefer-destructuring
    cookie = res.headers['set-cookie'][0];
  });

  beforeEach(async () => {
    await tearDownUserDB();

    await setUpUserDB();
    await setUpGroupDB();
    await setUpPersonalScheduleDB();
    await setUpGroupScheduleDB2();
    await setUpGroupPostDB();
    await setUpLikeDB();
  });

  afterEach(async () => {
    await tearDownLikeDB();
    await tearDownGroupPostDB();
    await tearDownPersonalScheduleDB();
    await tearDownGroupScheduleDB();
    await tearDownGroupDB();
    await tearDownUserDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test GET /api/user/group', () => {
    it('Successfully get a list of group', async () => {
      const res = await request(app).get('/api/user/group').set('Cookie', cookie);
      const expectedGroups = {
        groupList: [{
          groupId: 1,
          leader: 1,
          description: 'test-description1',
          name: 'test-group1',
          member: 2,
          inviteCode: 'inviteCode01',
          inviteExp: '2099-01-01T00:00:00.000Z',
          isPublicGroup: 0,
          image: 'groupImageLink',
          UserGroup: {
            groupId: 1, userId: 1, shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0, accessLevel: 'owner',
          },
        }, {
          groupId: 2,
          leader: 2,
          description: 'test-description2',
          name: 'test-group2',
          member: 6,
          inviteCode: 'expiredCode02',
          inviteExp: '2000-01-01T00:00:00.000Z',
          isPublicGroup: 0,
          image: 'groupImageLink',
          UserGroup: {
            groupId: 2, userId: 1, shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0, accessLevel: 'regular',
          },
        }],
      };

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedGroups);
    });
  });

  describe('Test PATCH /api/user/profile', () => {
    it('Successfully modified user profile ', async () => {
      const newNickname = 'newNickname';
      const newEmail = 'newEmail@email.com';
      const newIntroduction = 'newIntroduction';
      const data = `{\"nickname\": \"${newNickname}\", \"email\": \"${newEmail}\", \"introduction\": \"${newIntroduction}\"}`;
      const res = await request(app).patch('/api/user/profile').set('Cookie', cookie).field('data', data);
      const expectedResult = {
        email: newEmail,
        nickname: newNickname,
        profileImage: 'profileImageLink',
        provider: 'local',
        snsId: null,
        introduction: newIntroduction,
        userId: 1,
        postCount: 6,
        groupCount: 2,
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });
  });

  describe('Test PATCH /api/user/profile/password', () => {
    it('Successfully modified user password ', async () => {
      const currentPassword = 'super_strong_password'
      const newPassword = 'newPassword';
      let res = await request(app).patch('/api/user/profile/password').set('Cookie', cookie).send({
        currentPassword,
        newPassword
      });
      expect(res.status).toEqual(200);

      res = await request(app).post('/api/auth/login').set('Cookie', cookie).send({
        email: 'test-user1@email.com',
        password: newPassword,
      });
      expect(res.status).toEqual(200);
    });
  });

  describe('Test GET /api/user/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const startDateTime = '2023-04-01T00:00:00.000Z';
      const endDateTime = '2023-04-30T23:59:59.999Z';
      const expectedSchedule = {
        earliestDate: '2023-01-15T12:00:00.000Z',
        schedules: [
          {
            id: 1,
            userId: 1,
            title: 'test-title1',
            content: 'test-content1',
            startDateTime: '2023-02-03T00:00:00.000Z',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 2,
            userId: 1,
            title: 'test-title2',
            content: 'test-content2',
            startDateTime: '2023-04-15T00:00:00.000Z',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 3,
            userId: 1,
            title: 'test-title3',
            content: 'test-content3',
            startDateTime: '2023-04-10T00:00:00.000Z',
            endDateTime: '2023-04-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 4,
            userId: 1,
            title: 'test-title4',
            content: 'test-content4',
            startDateTime: '2023-04-01T00:00:00.000Z',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 5,
            userId: 1,
            title: 'test-title5',
            content: 'test-content5',
            startDateTime: '2023-03-15T00:00:00.000Z',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 6,
            userId: 1,
            title: 'test-title6',
            content: 'test-content6',
            startDateTime: '2023-04-15T00:00:00.000Z',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 9,
            userId: 1,
            title: 'test-title9',
            content: 'test-content9',
            startDateTime: '2023-03-15T00:00:00.000Z',
            endDateTime: '2023-04-01T08:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 10,
            userId: 1,
            title: 'test-title10',
            content: 'test-content10',
            startDateTime: '2023-04-30T23:59:59.000Z',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 0
          },
          {
            id: 11,
            userId: 1,
            title: 'test-title11',
            content: 'test-content11',
            startDateTime: '2020-01-01T12:00:00.000Z',
            endDatetime: '2020-01-01T13:00:00.000Z',
            recurrence: 1,
            freq: 'DAILY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-01-01T12:00:00.000Z',
            endRecur: '2023-04-05T14:00:00.000Z'
          },
          {
            id: 12,
            userId: 1,
            title: 'test-title12',
            content: 'test-content12',
            startDateTime: '2020-01-15T12:00:00.000Z',
            endDatetime: '2020-01-15T13:00:00.000Z',
            recurrence: 1,
            freq: 'MONTHLY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-01-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 13,
            userId: 1,
            title: 'test-title13',
            content: 'test-content13',
            startDateTime: '2020-01-15T12:00:00.000Z',
            endDatetime: '2020-01-15T13:00:00.000Z',
            recurrence: 1,
            freq: 'WEEKLY',
            interval: 1,
            byweekday: ["WE"],
            isGroup: 0,
            startRecur: '2020-01-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 14,
            userId: 1,
            title: 'test-title14',
            content: 'test-content14',
            startDateTime: '2020-04-15T12:00:00.000Z',
            endDatetime: '2020-04-15T13:00:00.000Z',
            recurrence: 1,
            freq: 'YEARLY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-04-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 15,
            userId: 1,
            title: 'test-title15',
            content: 'test-content15',
            startDateTime: '2020-01-13T12:00:00.000Z',
            endDatetime: '2020-01-13T13:00:00.000Z',
            recurrence: 1,
            freq: 'WEEKLY',
            interval: 1,
            byweekday: ["MO", "TU"],
            isGroup: 0,
            startRecur: '2020-01-13T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 16,
            userId: 1,
            title: 'test-title16',
            content: 'test-content16',
            startDateTime: '2020-03-15T12:00:00.000Z',
            endDatetime: '2020-04-01T00:00:00.000Z',
            recurrence: 1,
            freq: 'DAILY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-03-15T12:00:00.000Z',
            endRecur: '2023-03-20T00:00:00.000Z'
          },
          {
            id: 17,
            userId: 1,
            title: 'test-title17',
            content: 'test-content17',
            startDateTime: '2020-03-15T12:00:00.000Z',
            endDatetime: '2020-04-01T00:00:00.000Z',
            recurrence: 1,
            freq: 'WEEKLY',
            interval: 1,
            byweekday: ["SU"],
            isGroup: 0,
            startRecur: '2020-03-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 18,
            userId: 1,
            title: 'test-title18',
            content: 'test-content18',
            startDateTime: '2020-03-15T12:00:00.000Z',
            endDatetime: '2020-04-01T00:00:00.000Z',
            recurrence: 1,
            freq: 'MONTHLY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-03-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 19,
            userId: 1,
            title: 'test-title19',
            content: 'test-content19',
            startDateTime: '2020-01-15T12:00:00.000Z',
            endDatetime: '2020-04-01T00:00:00.000Z',
            recurrence: 1,
            freq: 'YEARLY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-01-15T12:00:00.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 21,
            userId: 1,
            title: 'test-title21',
            content: 'test-content21',
            startDateTime: '2020-04-30T23:59:59.000Z',
            endDatetime: '2020-05-01T23:59:59.000Z',
            recurrence: 1,
            freq: 'MONTHLY',
            interval: 1,
            byweekday: null,
            isGroup: 0,
            startRecur: '2020-04-30T23:59:59.000Z',
            endRecur: '2025-01-01T00:00:00.000Z'
          },
          {
            id: 1,
            groupId: 1,
            title: 'test-title1',
            content: 'test-content1',
            startDateTime: '2023-02-03T00:00:00.000Z',
            endDateTime: '2023-05-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 1
          },
          {
            id: 2,
            groupId: 1,
            title: 'test-title2',
            content: 'test-content2',
            startDateTime: '2023-04-15T00:00:00.000Z',
            endDateTime: '2023-04-30T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 1
          },
          {
            id: 3,
            groupId: 2,
            title: 'test-title3',
            content: 'test-content3',
            startDateTime: '2023-04-10T00:00:00.000Z',
            endDateTime: '2023-04-15T23:59:59.000Z',
            recurrence: 0,
            freq: null,
            interval: null,
            byweekday: null,
            until: null,
            isGroup: 1
          }
        ],
      };
      const res = await request(app).get('/api/user/calendar').set('Cookie', cookie).query({
        startDateTime,
        endDateTime,
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });

  describe('Test GET /api/user/calendar/:schedule_id', () => {
    it('Successfully retrieved a schedule', async () => {
      const scheduleId = 1;
      const res = await request(app).get(`/api/user/calendar/${scheduleId}`).set('Cookie', cookie);
      const expectedResult = {
        byweekday: null,
        content: 'test-content1',
        endDateTime: '2023-05-15T23:59:59.000Z',
        freq: null,
        id: 1,
        interval: null,
        recurrence: 0,
        startDateTime: '2023-02-03T00:00:00.000Z',
        title: 'test-title1',
        until: null,
        userId: 1,
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved a schedule. (Schedule Not Found) ', async () => {
      const scheduleId = 10000;
      const res = (await request(app).get(`/api/user/calendar/${scheduleId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '일정을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved a schedule. (DataFormat Error) ', async () => {
      const scheduleId = 'abc';
      const res = (await request(app).get(`/api/user/calendar/${scheduleId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test PUT /api/user/calendar/:id', () => {
    it('Successfully modified user schedule ', async () => {
      const id = 1;
      const res = await request(app).put(`/api/user/calendar/${id}`).set('Cookie', cookie).send({
        title: 'modified-title',
        content: 'modified-content',
        startDateTime: '2099-01-01T12:00:00.000Z',
        endDateTime: '2099-01-01T12:00:00.000Z',
        recurrence: 0,
        freq: null,
        interval: null,
        byweekday: null,
        until: null,
      });
      const modifiedSchedule = await PersonalSchedule.findOne({
        where: { title: 'modified-title', content: 'modified-content' },
      });
      expect(res.status).toEqual(201);
      expect(modifiedSchedule.id).toEqual(1);
    });

    it('Successfully fail to modified user schedule (long name)', async () => {
      const id = 1;
      const res = await request(app).put(`/api/user/calendar/${id}`).set('Cookie', cookie).send({
        title: 'very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-name',
      });
      expect(res.status).toEqual(400);
    });
  });

  describe('Test POST /api/user/calendar', () => {
    it('Successfully insert a user schedule into the database (non-recurrence)', async () => {
      const schedule = {
        title: 'test-title',
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 0,
        freq: null,
        interval: null,
        byweekday: null,
        until: null,
      };

      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      const expectedResult = {
        id: 25,
        userId: 1,
        message: '성공적으로 등록되었습니다.',
        title: 'test-title',
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 0,
        freq: null,
        interval: null,
        byweekday: null,
        until: null,
      };

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully insert a user schedule into the database (recurrence)', async () => {
      const schedule = {
        title: 'test-title',
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 1,
        freq: 'WEEKLY',
        interval: 1,
        byweekday: ['MO'],
        until: '2026-01-05T00:00:00.000Z',
      };
      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      expect(res.statusCode).toEqual(201);
    });

    it('Successfully fail to insert a user schedule into the database (Incorrect Data format)', async () => {
      const schedule = {
        content: 'test-content1',
        startDateTime: '2023-02-03T00:00:00.000Z',
        endDateTime: '2023-05-15T00:00:00.000Z',
        recurrence: 0,
      };
      const res = await request(app).post('/api/user/calendar').set('Cookie', cookie).send(schedule);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: '\"title\" is required' });
    });
  });

  describe('Test DELETE /api/user/calendar', () => {
    it('Successfully deleted a User schedule from the database ', async () => {
      const id = 9;
      const res = await request(app).delete(`/api/user/calendar/${id}`).set('Cookie', cookie);
      expect(res.statusCode).toEqual(204);
    });

    it('Successfully failed to delete a User schedule from the database (non-existent schedule)', async () => {
      const id = 10000;
      const res = await request(app).delete(`/api/user/calendar/${id}`).set('Cookie', cookie);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: '데이터를 찾을 수 없습니다.' });
    });

    it('Successfully failed to delete a User schedule from the database (Edit Permission Error)', async () => {
      const id = 24;
      const res = await request(app).delete(`/api/user/calendar/${id}`).set('Cookie', cookie);
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Test DELETE /api/auth/withdrawal', () => {
    it('Successfully deleted a user from user table', async () => {
      let res = await request(app).post('/api/auth/login').send({
        email: 'test-user6@email.com',
        password: 'super_strong_password',
      });
      // eslint-disable-next-line prefer-destructuring
      const tempCookie = res.headers['set-cookie'][0];
      res = await request(app).delete('/api/auth/withdrawal').set('Cookie', tempCookie);
      expect(res.status).toEqual(204);
    });

    it('Successfully failed to delete a user from user table (BelongToGroup Error)', async () => {
      let res = await request(app).post('/api/auth/login').send({
        email: 'test-user5@email.com',
        password: 'super_strong_password',
      });
      // eslint-disable-next-line prefer-destructuring
      const tempCookie = res.headers['set-cookie'][0];
      res = await request(app).delete('/api/auth/withdrawal').set('Cookie', tempCookie);
      expect(res.status).toEqual(403);
    });
  });

  describe('Test PATCH /api/user/settings', () => {
    it('Successfully updated a shareScheduleOption', async () => {
      const groupId = 1;
      const res = await request(app).patch(`/api/user/settings/${groupId}`).set('Cookie', cookie).send({
        shareScheduleOption: 1,
      });

      expect(res.status).toEqual(200);
    });

    it('Successfully updated a notificationOption', async () => {
      const groupId = 1;
      const res = await request(app).patch(`/api/user/settings/${groupId}`).set('Cookie', cookie).send({
        notificationOption: 1,
      });

      expect(res.status).toEqual(200);
    });
  });

  describe('Test GET /api/user/post', () => {
    it('Successfully retrieved feed', async () => {
      const lastRecordId = 0;
      const res = await request(app).get('/api/user/post').set('Cookie', cookie).query({
        last_record_id: lastRecordId,
      });
      const expectedResult = [
        {
          postId: 1,
          groupId: 1,
          isMine: true,
          isLiked: false,
          likesCount: 0,
          title: 'test-title1',
          author: 'test-user1',
          content: 'test-content1',
        },
        {
          postId: 2,
          groupId: 1,
          isMine: false,
          isLiked: true,
          likesCount: 2,
          title: 'test-title2',
          author: 'test-user2',
          content: 'test-content2',
        },
        {
          postId: 3,
          groupId: 1,
          isMine: true,
          isLiked: true,
          likesCount: 1,
          title: 'test-title3',
          author: 'test-user1',
          content: 'test-content3',
        },
        {
          postId: 4,
          groupId: 1,
          isMine: true,
          isLiked: false,
          likesCount: 0,
          title: 'test-title4',
          author: 'test-user1',
          content: 'test-content4',
        },
        {
          postId: 5,
          groupId: 1,
          isMine: true,
          isLiked: false,
          likesCount: 0,
          title: 'test-title5',
          author: 'test-user1',
          content: 'test-content5',
        },
        {
          postId: 6,
          groupId: 2,
          isMine: false,
          isLiked: false,
          likesCount: 0,
          title: 'test-title6',
          author: 'test-user2',
          content: 'test-content6',
        },
        {
          postId: 7,
          groupId: 1,
          isMine: false,
          isLiked: false,
          likesCount: 0,
          title: 'test-title7',
          author: 'test-user2',
          content: 'test-content7',
        },
        {
          postId: 8,
          groupId: 1,
          isMine: false,
          isLiked: false,
          likesCount: 0,
          title: 'test-title8',
          author: 'test-user2',
          content: 'test-content8',
        },
        {
          postId: 9,
          groupId: 2,
          isMine: true,
          isLiked: false,
          likesCount: 0,
          title: 'test-title9',
          author: 'test-user1',
          content: 'test-content9',
        },
      ];

      const result = res.body.feed.map((post) => ({
        postId: post.postId,
        groupId: post.groupId,
        title: post.title,
        author: post.author,
        content: post.content,
        isMine: post.isMine,
        isLiked: post.isLiked,
        likesCount: post.likesCount,
      }));
      expect(res.status).toEqual(200);
      expect(result).toEqual(expectedResult);
    });

    it('Successfully failed to retrieve feed (DataFormat Error)', async () => {
      const lastRecordId = 'abc';
      const res = await request(app).get('/api/user/post').set('Cookie', cookie).query({
        last_record_id: lastRecordId,
      });
      expect(res.status).toEqual(400);
    });
  });

  describe('Test PATCH /api/user/introduction', () => {
    it('Successfully updated a introduction', async () => {
      const res = await request(app).patch('/api/user/introduction').set('Cookie', cookie).send({
        introduction: 'modified-introduction',
      });
      const expectedResult = {
        message: '성공적으로 수정되었습니다.',
        introduction: 'modified-introduction',
      }

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });
  });
});
