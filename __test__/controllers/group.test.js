const request = require('supertest');
const app = require('../../src/app');
const GroupSchedule = require('../../src/models/groupSchedule');
const {
  db, syncDB, dropDB,
  tearDownGroupDB, tearDownGroupScheduleDB,
  setUpGroupDB, setUpGroupScheduleDB, setUpUserDB, tearDownPersonalScheduleDB,
  setUpPersonalScheduleDB2, setUpGroupPostDB, tearDownGroupPostDB,
  setUpLikeDB, tearDownLikeDB,
} = require('../dbSetup');
const Group = require('../../src/models/group');

describe('Test /api/group endpoints', () => {
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
    await setUpPersonalScheduleDB2();
    await setUpGroupDB();
    await setUpGroupScheduleDB();
    await setUpGroupPostDB();
    await setUpLikeDB();
  });

  afterEach(async () => {
    await tearDownLikeDB();
    await tearDownPersonalScheduleDB();
    await tearDownGroupScheduleDB();
    await tearDownGroupPostDB();
    await tearDownGroupDB();
  });

  afterAll(async () => {
    await dropDB();
    await db.sequelize.close();
  });

  describe('Test POST /api/group', () => {
    it('Successfully create group', async () => {
      const data = '{\"name\": \"test-group1\", \"description\": \"\'test-description1\'\"}';
      const res = await request(app).post('/api/group').set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(200);
    });
  });

  describe('Test DELETE /api/group', () => {
    it('Successfully delete group', async () => {
      const id = 1;
      const res = await request(app).delete(`/api/group/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(204);
    });

    it('Successfully fail to group (not a group leader)', async () => {
      const id = 2;
      const res = await request(app).delete(`/api/group/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(403);
    });

    it('Successfully fail to delete group (Group Not Found)', async () => {
      const id = 5;
      const res = await request(app).delete(`/api/group/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully fail to delete group (DataFormat Error)', async () => {
      const id = 'abc';
      const res = await request(app).delete(`/api/group/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test PUT /api/group', () => {
    it('Successfully modified group info ', async () => {
      const groupId = 1;
      const data = '{\"name\": \"modified-group1\", \"description\": \"modified-description1\"}';
      const res = await request(app).put(`/api/group/${groupId}`).set('Cookie', cookie).field('data', data);

      const group = await Group.findByPk(groupId);

      expect(res.status).toEqual(200);
      expect(group.name).toEqual('modified-group1');
      expect(group.description).toEqual('modified-description1');
    });

    it('Successfully failed to modified group (group not found)', async () => {
      const groupId = 100;
      const data = '{\"name\": \"modified-group1\", \"description\": \"\'modified-description1\'\"}';
      const res = await request(app).put(`/api/group/${groupId}`).set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(404);
    });
  });

  describe('Test GET /api/group/:group_id/info', () => {
    it('Successfully get a group info', async () => {
      const groupId = 1;
      const res = await request(app).get(`/api/group/${groupId}/info`).set('Cookie', cookie);
      const expectedGroups = {
        accessLevel: 'owner',
        information: {
          groupId: 1,
          name: 'test-group1',
          description: 'test-description1',
          member: 2,
          feed: 8,
        },
      };

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedGroups);
    });

    it('Successfully failed to get an group info (Group Not Found)', async () => {
      const groupId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/info`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully fail to get an group info (DataFormat Error)', async () => {
      const groupId = 'abc';
      const res = await request(app).get(`/api/group/${groupId}/info`).set('Cookie', cookie);
      expect(res.status).toEqual(400);
    });
  });

  describe('Test GET /api/group/:group_id', () => {
    it('Successfully get a group detail', async () => {
      const id = 1;
      const res = await request(app).get(`/api/group/${id}`).set('Cookie', cookie);
      const expectedGroups = {
        accessLevel: 'owner',
        information: {
          group: {
            groupId: 1,
            inviteCode: 'inviteCode01',
            inviteExp: '2099-01-01T00:00:00.000Z',
            isPublicGroup: 0,
            description: 'test-description1',
            leader: 1,
            member: 2,
            name: 'test-group1',
            image: 'groupImageLink',
          },
          leaderInfo: {
            nickname: 'test-user1',
            userId: 1,
          },
          memberInfo: [
            {
              nickname: 'test-user1',
              userId: 1,
            },
            {
              nickname: 'test-user2',
              userId: 2,
            },
          ],
        },
      };

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedGroups);
    });

    it('Successfully fail to get an group detail (DataFormat Error)', async () => {
      const id = 'abc';
      const res = await request(app).get(`/api/group/${id}`).set('Cookie', cookie);
      expect(res.status).toEqual(400);
    });

    it('Successfully failed to get an group detail (Group Not Found)', async () => {
      const id = 10000;
      const res = (await request(app).get(`/api/group/${id}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/calendar', () => {
    it('Group schedule creation successful ', async () => {
      const groupId = 1;
      const res = await request(app).post(`/api/group/${groupId}/calendar`).set('Cookie', cookie).send({
        title: 'test-title',
        content: 'test-content',
        startDateTime: '2023-05-06T00:00:00.000Z',
        endDateTime: '2023-05-07T00:00:00.000Z',
        recurrence: 1,
        freq: 'WEEKLY',
        interval: 1,
        byweekday: ['MO'],
        until: '2026-01-05T00:00:00.000Z',
      });
      const expectedResult = {
        id: 24,
        title: 'test-title',
        content: 'test-content',
        startDateTime: '2023-05-06T00:00:00.000Z',
        endDateTime: '2023-05-07T00:00:00.000Z',
        recurrence: 1,
        freq: 'WEEKLY',
        interval: 1,
        byweekday: ['MO'],
        until: '2026-01-05T00:00:00.000Z',
        groupId: 1,
        message: '성공적으로 등록되었습니다.',
      };

      expect(res.status).toEqual(201);
      expect(res.body).toEqual(expectedResult);
    });
  });

  describe('Test PUT /api/group/:group_id/calendar/:schedule_id', () => {
    it('Group Schedule Modification Successful ', async () => {
      const groupId = 1;
      const scheduleId = 1;
      const res = await request(app).put(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie).send({
        title: 'modified-title',
        content: 'modified-contnent',
        startDateTime: '2099-01-01T12:00:00.000Z',
        endDateTime: '2099-01-01T12:00:00.000Z',
        recurrence: 0,
        freq: null,
        interval: null,
        byweekday: null,
        until: null,
      });

      const modifiedSchedule = await GroupSchedule.findOne({
        where: { title: 'modified-title', content: 'modified-contnent' },
      });

      expect(modifiedSchedule.id).toEqual(1);
      expect(res.status).toEqual(201);
    });
  });

  describe('Test DELETE /api/group/:group_id/calendar', () => {
    it('Group schedule deleted successfully ', async () => {
      const groupId = 1;
      const scheduleId = 4;
      const res = await request(app).delete(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie);
      expect(res.status).toEqual(204);
    });

    it('Successfully fail to delete group (DataFormat Error)', async () => {
      const groupId = 1;
      const scheduleId = 'abc';
      const res = await request(app).delete(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie);
      expect(res.status).toEqual(400);
    });
  });

  describe('Test GET /api/group/:group_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const groupID = 1;
      const startDateTime = '2023-04-01T00:00:00.000Z';
      const endDateTime = '2023-04-30T23:59:59.999Z';
      const expectedSchedule = {
        accessLevel: 'owner',
        schedule: {
          earliestDate: '2023-01-15T12:00:00.000Z',
          nonRecurrenceSchedule: [
            {
              id: 1,
              userId: 1,
              isGroup: 0,
              content: 'test-content1',
              endDateTime: '2023-05-15T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-02-03T00:00:00.000Z',
              title: 'test-title1',
            },
            {
              id: 2,
              userId: 1,
              isGroup: 0,
              content: 'test-content2',
              endDateTime: '2023-04-30T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-04-15T00:00:00.000Z',
              title: 'test-title2',
            },
            {
              id: 1,
              isGroup: 1,
              groupId: 1,
              content: 'test-content1',
              endDateTime: '2023-05-15T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-02-03T00:00:00.000Z',
              title: 'test-title1',
            },
            {
              id: 2,
              isGroup: 1,
              groupId: 1,
              content: 'test-content2',
              endDateTime: '2023-04-30T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-04-15T00:00:00.000Z',
              title: 'test-title2',
            },
            {
              id: 4,
              isGroup: 1,
              groupId: 1,
              content: 'test-content4',
              endDateTime: '2023-04-30T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-04-01T00:00:00.000Z',
              title: 'test-title4',
            },
            {
              id: 5,
              isGroup: 1,
              groupId: 1,
              content: 'test-content5',
              endDateTime: '2023-04-30T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-03-15T00:00:00.000Z',
              title: 'test-title5',
            },
            {
              id: 6,
              isGroup: 1,
              groupId: 1,
              content: 'test-content6',
              endDateTime: '2023-05-15T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-04-15T00:00:00.000Z',
              title: 'test-title6',
            },
            {
              id: 9,
              isGroup: 1,
              groupId: 1,
              content: 'test-content9',
              endDateTime: '2023-04-01T08:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-03-15T00:00:00.000Z',
              title: 'test-title9',
            },
            {
              id: 10,
              isGroup: 1,
              groupId: 1,
              content: 'test-content10',
              endDateTime: '2023-05-15T23:59:59.000Z',
              recurrence: 0,
              startDateTime: '2023-04-30T23:59:59.000Z',
              title: 'test-title10',
            },
          ],
          recurrenceSchedule: [
            {
              byweekday: null,
              content: 'test-content11',
              freq: 'DAILY',
              groupId: 1,
              id: 11,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-01T13:00:00.000Z', startDateTime: '2023-04-01T12:00:00.000Z' },
                { endDateTime: '2023-04-02T13:00:00.000Z', startDateTime: '2023-04-02T12:00:00.000Z' },
                { endDateTime: '2023-04-03T13:00:00.000Z', startDateTime: '2023-04-03T12:00:00.000Z' },
                { endDateTime: '2023-04-04T13:00:00.000Z', startDateTime: '2023-04-04T12:00:00.000Z' },
                { endDateTime: '2023-04-05T13:00:00.000Z', startDateTime: '2023-04-05T12:00:00.000Z' },
              ],
              title: 'test-title11',
              startDateTime: '2020-01-01T12:00:00.000Z',
              endDateTime: '2020-01-01T13:00:00.000Z',
              until: '2023-04-05T14:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content12',
              freq: 'MONTHLY',
              groupId: 1,
              id: 12,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
              ],
              title: 'test-title12',
              startDateTime: '2020-01-15T12:00:00.000Z',
              endDateTime: '2020-01-15T13:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: ['WE'],
              content: 'test-content13',
              freq: 'WEEKLY',
              groupId: 1,
              id: 13,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-05T13:00:00.000Z', startDateTime: '2023-04-05T12:00:00.000Z' },
                { endDateTime: '2023-04-12T13:00:00.000Z', startDateTime: '2023-04-12T12:00:00.000Z' },
                { endDateTime: '2023-04-19T13:00:00.000Z', startDateTime: '2023-04-19T12:00:00.000Z' },
                { endDateTime: '2023-04-26T13:00:00.000Z', startDateTime: '2023-04-26T12:00:00.000Z' },
              ],
              title: 'test-title13',
              startDateTime: '2020-01-15T12:00:00.000Z',
              endDateTime: '2020-01-15T13:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content14',
              freq: 'YEARLY',
              groupId: 1,
              id: 14,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-15T13:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
              ],
              title: 'test-title14',
              startDateTime: '2020-04-15T12:00:00.000Z',
              endDateTime: '2020-04-15T13:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: ['MO','TU'],
              content: 'test-content15',
              freq: 'WEEKLY',
              groupId: 1,
              id: 15,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-03T13:00:00.000Z', startDateTime: '2023-04-03T12:00:00.000Z' },
                { endDateTime: '2023-04-04T13:00:00.000Z', startDateTime: '2023-04-04T12:00:00.000Z' },
                { endDateTime: '2023-04-10T13:00:00.000Z', startDateTime: '2023-04-10T12:00:00.000Z' },
                { endDateTime: '2023-04-11T13:00:00.000Z', startDateTime: '2023-04-11T12:00:00.000Z' },
                { endDateTime: '2023-04-17T13:00:00.000Z', startDateTime: '2023-04-17T12:00:00.000Z' },
                { endDateTime: '2023-04-18T13:00:00.000Z', startDateTime: '2023-04-18T12:00:00.000Z' },
                { endDateTime: '2023-04-24T13:00:00.000Z', startDateTime: '2023-04-24T12:00:00.000Z' },
                { endDateTime: '2023-04-25T13:00:00.000Z', startDateTime: '2023-04-25T12:00:00.000Z' },
              ],
              title: 'test-title15',
              startDateTime: '2020-01-13T12:00:00.000Z',
              endDateTime: '2020-01-13T13:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content16',
              freq: 'DAILY',
              groupId: 1,
              id: 16,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-02T00:00:00.000Z', startDateTime: '2023-03-16T12:00:00.000Z' },
                { endDateTime: '2023-04-03T00:00:00.000Z', startDateTime: '2023-03-17T12:00:00.000Z' },
                { endDateTime: '2023-04-04T00:00:00.000Z', startDateTime: '2023-03-18T12:00:00.000Z' },
                { endDateTime: '2023-04-05T00:00:00.000Z', startDateTime: '2023-03-19T12:00:00.000Z' },
              ],
              title: 'test-title16',
              startDateTime: '2020-03-15T12:00:00.000Z',
              endDateTime: '2020-04-01T00:00:00.000Z',
              until: '2023-03-20T00:00:00.000Z',
            },
            {
              byweekday: ['SU'],
              content: 'test-content17',
              freq: 'WEEKLY',
              groupId: 1,
              id: 17,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-05T00:00:00.000Z', startDateTime: '2023-03-19T12:00:00.000Z' },
                { endDateTime: '2023-04-12T00:00:00.000Z', startDateTime: '2023-03-26T12:00:00.000Z' },
                { endDateTime: '2023-04-19T00:00:00.000Z', startDateTime: '2023-04-02T12:00:00.000Z' },
                { endDateTime: '2023-04-26T00:00:00.000Z', startDateTime: '2023-04-09T12:00:00.000Z' },
                { endDateTime: '2023-05-03T00:00:00.000Z', startDateTime: '2023-04-16T12:00:00.000Z' },
                { endDateTime: '2023-05-10T00:00:00.000Z', startDateTime: '2023-04-23T12:00:00.000Z' },
                { endDateTime: '2023-05-17T00:00:00.000Z', startDateTime: '2023-04-30T12:00:00.000Z' },
              ],
              title: 'test-title17',
              startDateTime: '2020-03-15T12:00:00.000Z',
              endDateTime: '2020-04-01T00:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content18',
              freq: 'MONTHLY',
              groupId: 1,
              id: 18,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-05-02T00:00:00.000Z', startDateTime: '2023-04-15T12:00:00.000Z' },
              ],
              title: 'test-title18',
              startDateTime: '2020-03-15T12:00:00.000Z',
              endDateTime: '2020-04-01T00:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content19',
              freq: 'YEARLY',
              groupId: 1,
              id: 19,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-04-02T00:00:00.000Z', startDateTime: '2023-01-15T12:00:00.000Z' },
              ],
              title: 'test-title19',
              startDateTime: '2020-01-15T12:00:00.000Z',
              endDateTime: '2020-04-01T00:00:00.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
            {
              byweekday: null,
              content: 'test-content21',
              freq: 'MONTHLY',
              groupId: 1,
              id: 21,
              isGroup: 1,
              interval: 1,
              recurrence: 1,
              recurrenceDateList: [
                { endDateTime: '2023-05-01T23:59:59.000Z', startDateTime: '2023-04-30T23:59:59.000Z' },
              ],
              title: 'test-title21',
              startDateTime: '2020-04-30T23:59:59.000Z',
              endDateTime: '2020-05-01T23:59:59.000Z',
              until: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      };
      const res = await request(app).get(`/api/group/${groupID}/calendar`).set('Cookie', cookie).query({
        startDateTime,
        endDateTime,
      });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });

  describe('Test POST /api/group/:group_id/members/request', () => {
    it('Successfully completed the application for registration.  ', async () => {
      const groupId = 4;
      const res = (await request(app).post(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      expect(res.status).toEqual(200);
    });

    it('Successfully failed to complete the application for registration. (Group Not Found) ', async () => {
      const groupId = 10000;
      const res = (await request(app).post(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to complete the application for registration. (Member Group Not Found) ', async () => {
      const groupId = 1;
      const res = (await request(app).post(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '이미 가입된 그룹입니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/join/invite-link', () => {
    it('Successfully generated invitation code ', async () => {
      const groupId = 1;
      const res = (await request(app).post(`/api/group/${groupId}/join/invite-link`).set('Cookie', cookie));
      expect(res.status).toEqual(200);
    });

    it('Successfully failed to create invitation code (Group Not Found) ', async () => {
      const groupId = 100;
      const res = (await request(app).post(`/api/group/${groupId}/join/invite-link`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/join/:inviteCode', () => {
    it('Successfully joined the group ', async () => {
      const groupId = 3;
      const inviteCode = 'inviteCode03';
      const res = (await request(app).post(`/api/group/${groupId}/join/${inviteCode}`).set('Cookie', cookie));
      expect(res.status).toEqual(200);
      expect(res.body).toEqual({ message: '성공적으로 가입되었습니다.' });
    });

    it('Successfully failed to join the group (Group Not Found) ', async () => {
      const groupId = 1;
      const inviteCode = 'isWrongInviteCode';
      const res = (await request(app).post(`/api/group/${groupId}/join/${inviteCode}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to join the group (Group Not Found2) ', async () => {
      const groupId = 3;
      const inviteCode = 'inviteCode01';
      const res = (await request(app).post(`/api/group/${groupId}/join/${inviteCode}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to join the group (Expired Code Error) ', async () => {
      const groupId = 2;
      const inviteCode = 'expiredCode02';
      const res = (await request(app).post(`/api/group/${groupId}/join/${inviteCode}`).set('Cookie', cookie));
      expect(res.status).toEqual(410);
      expect(res.body).toEqual({ error: '만료된 초대 링크입니다.' });
    });

    it('Successfully failed to join the group (Invalid Group Join Error) ', async () => {
      const groupId = 1;
      const inviteCode = 'inviteCode01';
      const res = (await request(app).post(`/api/group/${groupId}/join/${inviteCode}`).set('Cookie', cookie));
      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '이미 가입된 그룹입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/proposal', () => {
    it('Successfully get a list of Event', async () => {
      const id = 1;
      const date1 = '2023-04-15T00:00:00.000Z';
      const date2 = '2030-04-16T00:00:00.000Z';
      const date3 = '2000-04-01T00:00:00.000Z';
      const res = await request(app).get(`/api/group/${id}/proposal`).set('Cookie', cookie).query({
        date1,
        date2,
        date3,
      });
      const expectedProposal = {
        '2023-04-15T00:00:00.000Z': [],
        '2030-04-16T00:00:00.000Z': [
          {
            startDateTime: '2030-04-16T00:00:00.000Z',
            endDateTime: '2030-04-16T23:59:59.000Z',
            duration: 1440,
          },
        ],
        '2000-04-01T00:00:00.000Z': [
          {
            startDateTime: '2000-04-01T09:30:00.000Z',
            endDateTime: '2000-04-01T13:00:00.000Z',
            duration: 210,
          },
          {
            startDateTime: '2000-04-01T18:00:00.000Z',
            endDateTime: '2000-04-01T23:59:59.000Z',
            duration: 360,
          },
          {
            startDateTime: '2000-04-01T00:00:00.000Z',
            endDateTime: '2000-04-01T08:00:00.000Z',
            duration: 480,
          },
        ],
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedProposal);
    });
  });

  describe('Test GET /api/group/:group_id/calendar/:schedule_id', () => {
    it('Successfully retrieved a schedule', async () => {
      const groupId = 1;
      const scheduleId = 1;
      const res = await request(app).get(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie);
      const expectedResult = {
        accessLevel: 'owner',
        schedule: {
          byweekday: null,
          content: 'test-content1',
          endDateTime: '2023-05-15T23:59:59.000Z',
          freq: null,
          groupId: 1,
          id: 1,
          interval: null,
          recurrence: 0,
          startDateTime: '2023-02-03T00:00:00.000Z',
          title: 'test-title1',
          until: null,
        },
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved a schedule. (Schedule Not Found) ', async () => {
      const groupId = 1;
      const scheduleId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '일정을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved a schedule. (DataFormat Error) ', async () => {
      const groupId = 1;
      const scheduleId = 'abc';
      const res = (await request(app).get(`/api/group/${groupId}/calendar/${scheduleId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/post', () => {
    it('Successfully created the post ', async () => {
      const groupId = 1;
      const title = 'testTitle';
      const content = 'testContent';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).post(`/api/group/${groupId}/post`).set('Cookie', cookie).field('data', data);
      const expectedResult = {
        author: 'test-user1',
        content: 'testContent',
        image: null,
        message: '성공적으로 등록되었습니다.',
        postDetailId: 11,
        postId: 11,
        title: 'testTitle',
      };
      delete res.body.updatedAt;
      delete res.body.createdAt;
      expect(res.status).toEqual(201);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to create the post (Group Not Found) ', async () => {
      const groupId = 10000;
      const title = 'testTitle';
      const content = 'testContent';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).post(`/api/group/${groupId}/post`).set('Cookie', cookie).field('data', data);
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to create the post (DataFormat Error) ', async () => {
      const groupId = 1;
      const title = 123;
      const content = 123;
      const data = `{\"title\": \"${title}\", \"test\": \"${content}\"}`;
      const res = await request(app).post(`/api/group/${groupId}/post`).set('Cookie', cookie).field('data', data);
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test PUT /api/group/:group_id/post/:post_id', () => {
    it('Successfully modified the post ', async () => {
      const groupId = 1;
      const postId = 1;
      const title = 'modified-title';
      const content = 'modified-content';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).put(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie).field('data', data);
      const expectedResult = {
        author: 'test-user1',
        content: 'modified-content',
        groupId: 1,
        image: null,
        message: '성공적으로 수정되었습니다.',
        postDetailId: 1,
        postId: 1,
        title: 'modified-title',
        userId: 1,
      };
      delete res.body.updatedAt;
      delete res.body.createdAt;
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to modified the post (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const title = 'testTitle';
      const content = 'testContent';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).put(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to modified the post (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const title = 'testTitle';
      const content = 'testContent';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).put(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to modified the post (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 1;
      const title = 123;
      const content = 123;
      const data = `{\"title\": \"${title}\", \"test\": \"${content}\"}`;
      const res = await request(app).put(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });

    it('Successfully failed to modified the post (Edit Permission Error) ', async () => {
      const groupId = 1;
      const postId = 2;
      const title = 'modified-title';
      const content = 'modified-content';
      const data = `{\"title\": \"${title}\", \"content\": \"${content}\"}`;
      const res = await request(app).put(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie).field('data', data);

      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '수정할 권한이 없습니다.' });
    });
  });

  describe('Test DELETE /api/group/:group_id/post/:post_id', () => {
    it('Successfully deleted the post ', async () => {
      const groupId = 1;
      const postId = 1;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));

      expect(res.status).toEqual(204);
      expect(res.body).toEqual({});
    });

    it('Successfully failed to deleted the post (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to deleted the post (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to deleted the post (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const postId = 'abc';
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/post/:post_id', () => {
    it('Successfully retrieved the post ', async () => {
      const groupId = 1;
      const postId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      const expectedPost = {
        accessLevel: 'owner',
        post: {
          author: 'test-user1',
          content: 'test-content1',
          title: 'test-title1',
          isMine: true,
          isLiked: false,
          likesCount: 0,
          postId: 1,
          image: 'postImage',
        },
      };
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedPost);
    });

    it('Successfully failed to retrieved the post. (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the post. (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the post. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const postId = 'abc';
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/feed/:last_record_id', () => {
    it('Successfully retrieved the posts. ', async () => {
      const groupId = 1;
      const lastRecordId = 0;
      const res = (await request(app).get(`/api/group/${groupId}/feed/${lastRecordId}`).set('Cookie', cookie));
      const expectedResult = {
        accessLevel: 'owner',
        isEnd: true,
        feed: [
          {
            postId: 1, author: 'test-user1', title: 'test-title1', content: 'test-content1', isMine: true, isLiked: false, likesCount: 0, image: 'postImage',
          },
          {
            postId: 2, author: 'test-user2', title: 'test-title2', content: 'test-content2', isMine: false, isLiked: true, likesCount: 2, image: 'postImage',
          },
          {
            postId: 3, author: 'test-user1', title: 'test-title3', content: 'test-content3', isMine: true, isLiked: true, likesCount: 1, image: 'postImage',
          },
          {
            postId: 4, author: 'test-user1', title: 'test-title4', content: 'test-content4', isMine: true, isLiked: false, likesCount: 0, image: 'postImage',
          },
          {
            postId: 5, author: 'test-user1', title: 'test-title5', content: 'test-content5', isMine: true, isLiked: false, likesCount: 0, image: 'postImage',
          },
          {
            postId: 7, author: 'test-user2', title: 'test-title7', content: 'test-content7', isMine: false, isLiked: false, likesCount: 0, image: 'postImage',
          },
          {
            postId: 8, author: 'test-user2', title: 'test-title8', content: 'test-content8', isMine: false, isLiked: false, likesCount: 0, image: 'postImage',
          },
          {
            postId: 10, author: 'test-user1', title: 'test-title10', content: 'test-content10', isMine: true, isLiked: false, likesCount: 0, image: 'postImage',
          },
        ],
      };
      const { accessLevel, isEnd } = res.body;
      const feed = [];
      for (const post of res.body.feed) {
        feed.push({
          postId: post.postId,
          isMine: post.isMine,
          isLiked: post.isLiked,
          likesCount: post.likesCount,
          title: post.title,
          author: post.author,
          content: post.content,
          image: post.image,
        });
      }

      expect(res.status).toEqual(200);
      expect({ accessLevel, isEnd, feed }).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved the posts. (Group Not Found) ', async () => {
      const groupId = 10000;
      const lastRecordId = 0;
      const res = (await request(app).get(`/api/group/${groupId}/feed/${lastRecordId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the posts. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const lastRecordId = 0;
      const res = (await request(app).get(`/api/group/${groupId}/feed/${lastRecordId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group', () => {
    it('Successfully retrieved group lists. ', async () => {
      const res = (await request(app).get('/api/group/list/0').set('Cookie', cookie));
      const expectedResult = [
        {
          groupId: 4, name: 'test-group4', description: 'test-description4', member: 2, image: 'groupImageLink',
        },
        {
          groupId: 3, name: 'test-group3', description: 'test-description3', member: 1, image: 'groupImageLink',
        },
        {
          groupId: 2, name: 'test-group2', description: 'test-description2', member: 6, image: 'groupImageLink',
        },
        {
          groupId: 1, name: 'test-group1', description: 'test-description1', member: 2, image: 'groupImageLink',
        },

      ];
      const groups = [];
      for (const group of res.body.groups) {
        groups.push({
          groupId: group.groupId,
          name: group.name,
          description: group.description,
          member: group.member,
          image: group.image,
        });
      }
      expect(res.status).toEqual(200);
      expect(groups).toEqual(expectedResult);
    });

    it('Successfully failed to retrieve group lists.  (DataFormat Error) ', async () => {
      const lastRecordId = 'abc';
      const res = (await request(app).get(`/api/group/list/${lastRecordId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/post/:post_id/comment', () => {
    it('Successfully created the comment ', async () => {
      const groupId = 1;
      const postId = 1;
      const content = 'testComment';
      const res = (await request(app).post(`/api/group/${groupId}/post/${postId}/comment`).set('Cookie', cookie).send({
        content,
      }));
      const expectedResult = {
        commentId: 5,
        content: 'testComment',
        depth: 0,
        message: '성공적으로 등록되었습니다.',
        postId: 1,
      };
      delete res.body.updatedAt;
      delete res.body.createdAt;
      expect(res.status).toEqual(201);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to create the comment (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const content = 'testComment';
      const res = (await request(app).post(`/api/group/${groupId}/post/${postId}/comment`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to create the comment (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const content = 'testComment';
      const res = (await request(app).post(`/api/group/${groupId}/post/${postId}/comment`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to create the comment (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 1;
      const content = 123;
      const res = (await request(app).post(`/api/group/${groupId}/post/${postId}/comment`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test PUT /api/group/:group_id/post/:post_id/comment/:comment_id', () => {
    const content = 'testComment';

    it('Successfully modified the comment ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).put(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie).send({
        content,
      }));
      const expectedResult = {
        commentId: 1,
        content: 'testComment',
        depth: 0,
        message: '성공적으로 수정되었습니다.',
        postId: 1,
        userId: 1,
      };
      delete res.body.updatedAt;
      delete res.body.createdAt;

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to modified the comment (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).put(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to modified the comment (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const commentId = 1;
      const res = (await request(app).put(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to modified the comment (Comment Not Found) ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 10000;
      const res = (await request(app).put(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '댓글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to modified the comment (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 'abc';
      const res = (await request(app).put(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie).send({
        content,
      }));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test DELETE /api/group/:group_id/post/:post_id/comment/:comment_id', () => {
    it('Successfully deleted the comment ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(204);
    });

    it('Successfully failed to deleted the comment (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to deleted the comment (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const commentId = 1;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to deleted the comment (Comment Not Found) ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 10000;
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '댓글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to deleted the comment (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 'abc';
      const res = (await request(app).delete(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/post/:post_id/comment/:comment_id', () => {
    it('Successfully retrieved the comment. ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      const expectedResult = {
        accessLevel: 'owner',
        comment: {
          commentId: 1,
          content: 'test-comment1',
          depth: 0,
          postId: 1,
          userId: 1,
          isMine: true,
        },
      };

      const { accessLevel } = res.body;
      const comment = {
        commentId: res.body.comment.commentId,
        postId: res.body.comment.postId,
        userId: res.body.comment.userId,
        content: res.body.comment.content,
        depth: res.body.comment.depth,
        isMine: res.body.comment.isMine,
      };

      expect(res.status).toEqual(200);
      expect({ accessLevel, comment }).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved the comment (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the comment (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const commentId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the comment (Comment Not Found) ', async () => {
      const groupId = 1;
      const postId = 1;
      const commentId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '댓글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the comment. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const postId = 1;
      const commentId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/post/${postId}/comment/${commentId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/members', () => {
    it('Successfully retrieved the members ', async () => {
      const groupId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/members`).set('Cookie', cookie));
      const expectedResult = [
        {
          accessLevel: 'owner',
          member: {
            isPendingMember: 0, nickname: 'test-user1', userId: 1,
          },
        },
        {
          accessLevel: 'admin',
          member: {
            isPendingMember: 0, nickname: 'test-user2', userId: 2,
          },
        },
      ];
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved the members (Group Not Found) ', async () => {
      const groupId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/members`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the comments (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const res = (await request(app).get(`/api/group/${groupId}/members`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/members/request', () => {
    it('Successfully retrieved the members ', async () => {
      const groupId = 1;
      const res = (await request(app).get(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      const expectedResult = [
        {
          accessLevel: 'viewer',
          member: {
            isPendingMember: 1, nickname: 'test-user5', userId: 5,
          },
        },
      ];
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to retrieved the members (Group Not Found) ', async () => {
      const groupId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the comments (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const res = (await request(app).get(`/api/group/${groupId}/members/request`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/members/:user_id/approve', () => {
    it('Successfully approved the membership registration. ', async () => {
      const groupId = 1;
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/approve`).set('Cookie', cookie));
      expect(res.status).toEqual(200);
    });

    it('Successfully failed to approve the membership registration. (Group Not Found) ', async () => {
      const groupId = 10000;
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/approve`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to approve the membership registration. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/approve`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/members/:user_id/reject', () => {
    it('Successfully rejected the membership request. ', async () => {
      const groupId = 1;
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/reject`).set('Cookie', cookie));
      expect(res.status).toEqual(200);
    });

    it('Successfully failed to reject the membership request. (Group Not Found) ', async () => {
      const groupId = 10000;
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/reject`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to reject the membership request. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const userId = 2;
      const res = (await request(app).post(`/api/group/${groupId}/members/${userId}/reject`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test DELETE /api/group/:group_id/members/:user_id', () => {
    it('Successfully expelled a member. ', async () => {
      const groupId = 1;
      const userId = 4;
      const res = (await request(app).delete(`/api/group/${groupId}/members/${userId}`).set('Cookie', cookie));
      expect(res.status).toEqual(204);
    });

    it('Successfully failed to expell a member. (Group Not Found) ', async () => {
      const groupId = 10000;
      const userId = 2;
      const res = (await request(app).delete(`/api/group/${groupId}/members/${userId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to expell a member. (User Not Found) ', async () => {
      const groupId = 1;
      const userId = 10000;
      const res = (await request(app).delete(`/api/group/${groupId}/members/${userId}`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '유저를 찾을 수 없습니다.' });
    });

    it('Successfully failed to expell a member. (DataFormat Error) ', async () => {
      const groupId = 'abc';
      const userId = 2;
      const res = (await request(app).delete(`/api/group/${groupId}/members/${userId}`).set('Cookie', cookie));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });

    it('Successfully failed to expell a member. (No Ban Permission Error) ', async () => {
      const groupId = 1;
      const userId = 2;
      const res = (await request(app).delete(`/api/group/${groupId}/members/${userId}`).set('Cookie', cookie));
      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '방장이나 관리자는 강퇴할 수 없습니다. ' });
    });
  });

  describe('Test GET /api/group/search', () => {
    it('Successfully retrieved the group. ', async () => {
      const keyword = 'test';
      const res = (await request(app).get('/api/group/search').set('Cookie', cookie).query({
        keyword,
      }));

      const expectedResult = [{
        groupId: 1,
        name: 'test-group1',
        description: 'test-description1',
        member: 2,
        leader: 1,
        inviteCode: 'inviteCode01',
        isPublicGroup: 0,
        inviteExp: '2099-01-01T00:00:00.000Z',
        image: 'groupImageLink',
      },
      {
        groupId: 2,
        name: 'test-group2',
        description: 'test-description2',
        member: 6,
        leader: 2,
        inviteCode: 'expiredCode02',
        isPublicGroup: 0,
        inviteExp: '2000-01-01T00:00:00.000Z',
        image: 'groupImageLink',
      },
      {
        groupId: 3,
        name: 'test-group3',
        description: 'test-description3',
        member: 1,
        leader: 3,
        inviteCode: 'inviteCode03',
        isPublicGroup: 0,
        inviteExp: '2099-01-01T00:00:00.000Z',
        image: 'groupImageLink',
      },
      {
        groupId: 4,
        name: 'test-group4',
        description: 'test-description4',
        member: 2,
        leader: 3,
        inviteCode: 'inviteCode04',
        isPublicGroup: 0,
        inviteExp: '2099-01-01T00:00:00.000Z',
        image: 'groupImageLink',
      },
      ];

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully retrieved the group. ', async () => {
      const keyword = 1;
      const res = (await request(app).get('/api/group/search').set('Cookie', cookie).query({
        keyword,
      }));

      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });

    it('Successfully failed to retrieved the group (Group Not Found) ', async () => {
      const keyword = 'abcd';
      const res = (await request(app).get('/api/group/search').set('Cookie', cookie).query({
        keyword,
      }));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to retrieved the group (Keyword Length Range) ', async () => {
      const keyword = 'a';
      const res = (await request(app).get('/api/group/search').set('Cookie', cookie).query({
        keyword,
      }));
      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });
  });

  describe('Test GET /api/group/:group_id/join/invite-link', () => {
    it('Successfully retrieved invite code', async () => {
      const groupId = 1;
      const res = await request(app).get(`/api/group/${groupId}/join/invite-link`).set('Cookie', cookie);
      const expectedResult = {
        inviteCode: 'inviteCode01',
        exp: '2099-01-01T00:00:00.000Z',
      };

      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedResult);
    });

    it('Successfully failed to retrieve invite code (DataFormat Error)', async () => {
      const groupId = 'abc';
      const res = await request(app).get(`/api/group/${groupId}/join/invite-link`).set('Cookie', cookie);
      expect(res.status).toEqual(400);
    });

    it('Successfully failed to retrieve invite code (Group Not Found)', async () => {
      const groupId = 10000;
      const res = (await request(app).get(`/api/group/${groupId}/join/invite-link`).set('Cookie', cookie));
      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });
  });

  describe('Test POST /api/group/:group_id/post/:post_id/like', () => {
    it('Successfully created a Like ', async () => {
      const groupId = 1;
      const postId = 1;
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(201);
      expect(res.body).toEqual({ message: '성공적으로 등록되었습니다.' });
    });

    it('Successfully failed to create a Like (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to create a Like (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to create a Like (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 'abc';
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });

    it('Successfully failed to create a Like (Edit Permission Error) ', async () => {
      const groupId = 3;
      const postId = 10;
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '수정할 권한이 없습니다.' });
    });

    it('Successfully failed to create a Like ', async () => {
      const groupId = 1;
      const postId = 2;
      const res = await request(app).post(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(409);
      expect(res.body).toEqual({ error: '이미 전달된 요청입니다. ' });
    });
  });

  describe('Test DELETE /api/group/:group_id/post/:post_id/like', () => {
    it('Successfully deleted a Like ', async () => {
      const groupId = 1;
      const postId = 2;
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(204);
    });

    it('Successfully failed to delete a Like (Group Not Found) ', async () => {
      const groupId = 10000;
      const postId = 1;
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '그룹을 찾을 수 없습니다.' });
    });

    it('Successfully failed to delete a Like (Post Not Found) ', async () => {
      const groupId = 1;
      const postId = 10000;
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(404);
      expect(res.body).toEqual({ error: '글을 찾을 수 없습니다.' });
    });

    it('Successfully failed to delete a Like (DataFormat Error) ', async () => {
      const groupId = 1;
      const postId = 'abc';
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(400);
      expect(res.body).toEqual({ error: '지원하지 않는 형식의 데이터입니다.' });
    });

    it('Successfully failed to delete a Like (Edit Permission Error) ', async () => {
      const groupId = 3;
      const postId = 10;
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ error: '수정할 권한이 없습니다.' });
    });

    it('Successfully failed to delete a Like ', async () => {
      const groupId = 1;
      const postId = 1;
      const res = await request(app).delete(`/api/group/${groupId}/post/${postId}/like`).set('Cookie', cookie);

      expect(res.status).toEqual(409);
      expect(res.body).toEqual({ error: '이미 전달된 요청입니다. ' });
    });
  });
});
