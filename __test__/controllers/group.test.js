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
    await dropDB();
    await syncDB();

    const mockUser = {
      userId: 1,
      email: 'testGroup1@email.com',
      nickname: 'test-group1',
      password: 'test-group-password12345',
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
    // await tearDownGroupScheduleDB();
    // await tearDownGroupDB();
  });

  afterAll(async () => {
    // await dropDB();
    // await db.sequelize.close();
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

  // describe('Test POST /api/group', () => {
  //   it('Group creation successful ', async () => {
  //     const res = (await request(app).post('/api/group').set('Cookie', cookie).send({ name: 'test-group' }));
  //     expect(res.status).toEqual(200);
  //   });
  // });

  // describe('Test POST /api/group/calendar', () => {
  //   it('Group schedule creation successful ', async () => {
  //     const res = (await request(app).post('/api/group/calendar').set('Cookie', cookie).send({
  //       groupId: 1,
  //       title: 'test-title',
  //       contents: 'test-content',
  //       startDate: '2023-05-06',
  //       endDate: '2023-05-07',
  //       repetition: 1,
  //     }));
  //     expect(res.status).toEqual(201);
  //   });
  // });

  // describe('Test PUT /api/group/calendar', () => {
  //   it('Group Schedule Modification Successful ', async () => {
  //     const res = (await request(app).put('/api/group/calendar').set('Cookie', cookie).send({
  //       id: 1,
  //       groupId: 1,
  //       title: 'modified-title',
  //     }));
  //     const modifiedSchedule = await GroupSchedule.findOne({
  //       where: { title: 'modified-title' },
  //     });
  //     expect(modifiedSchedule.id).toEqual(1);
  //     expect(res.status).toEqual(201);
  //   });
  // });

  // describe('Test DELETE /api/group/calendar', () => {
  //   it('Group schedule deleted successfully ', async () => {
  //     const res = (await request(app).delete('/api/group/calendar').set('Cookie', cookie).send({
  //       id: 4,
  //     }));
  //     expect(res.status).toEqual(204);
  //   });
  // });

  describe('Test GET /api/group/:group_id/calendar', () => {
    it('Successfully get an April Schedule ', async () => {
      const groupID = 1;
      const date = '2023-04';
      const expectedSchedule = {
        "nonRecurrenceSchedule": [
          {"content": "test-content1", "endDateTime": "2023-05-15T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-02-03T00:00:00.000Z", "title": "test-title1"}, 
          {"content": "test-content2", "endDateTime": "2023-04-30T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-04-15T00:00:00.000Z", "title": "test-title2"},
          {"content": "test-content4", "endDateTime": "2023-04-30T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-04-01T00:00:00.000Z", "title": "test-title4"}, 
          {"content": "test-content5", "endDateTime": "2023-04-30T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-03-15T00:00:00.000Z", "title": "test-title5"}, 
          {"content": "test-content6", "endDateTime": "2023-05-15T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-04-15T00:00:00.000Z", "title": "test-title6"}, 
          {"content": "test-content9", "endDateTime": "2023-04-01T08:59:59.000Z", "recurrence": 0, "startDateTime": "2023-03-15T00:00:00.000Z", "title": "test-title9"}, 
          {"content": "test-content10", "endDateTime": "2023-05-15T23:59:59.000Z", "recurrence": 0, "startDateTime": "2023-04-30T23:59:59.000Z", "title": "test-title10"}
        ],
        "recurrenceSchedule": [
          {
            "byweekday": "", "content": "test-content11", "freq": "DAILY", "groupId": 1, "id": 11, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-01T13:00:00.000Z", "startDateTime": "2023-04-01T12:00:00.000Z" },
              { "endDateTime": "2023-04-02T13:00:00.000Z", "startDateTime": "2023-04-02T12:00:00.000Z" },
              { "endDateTime": "2023-04-03T13:00:00.000Z", "startDateTime": "2023-04-03T12:00:00.000Z" },
              { "endDateTime": "2023-04-04T13:00:00.000Z", "startDateTime": "2023-04-04T12:00:00.000Z" },
              { "endDateTime": "2023-04-05T13:00:00.000Z", "startDateTime": "2023-04-05T12:00:00.000Z" },
            ],
            "title": "test-title11", "until": "2023-04-05T14:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content12", "freq": "MONTHLY", "groupId": 1, "id": 12, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
             { "endDateTime": "2023-04-15T13:00:00.000Z", "startDateTime": "2023-04-15T12:00:00.000Z" },
            ],
            "title": "test-title12", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content13", "freq": "WEEKLY", "groupId": 1, "id": 13, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-05T13:00:00.000Z", "startDateTime": "2023-04-05T12:00:00.000Z" },
              { "endDateTime": "2023-04-12T13:00:00.000Z", "startDateTime": "2023-04-12T12:00:00.000Z" },
              { "endDateTime": "2023-04-19T13:00:00.000Z", "startDateTime": "2023-04-19T12:00:00.000Z" },
              { "endDateTime": "2023-04-26T13:00:00.000Z", "startDateTime": "2023-04-26T12:00:00.000Z" },
            ],
            "title": "test-title13", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content14", "freq": "YEARLY", "groupId": 1, "id": 14, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-15T13:00:00.000Z", "startDateTime": "2023-04-15T12:00:00.000Z" },
            ],
            "title": "test-title14", "until": "2025-01-01T00:00:00.000Z",
          },
          { 
            "byweekday": "MO,TU", "content": "test-content15", "freq": "DAILY", "groupId": 1, "id": 15, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-03T13:00:00.000Z", "startDateTime": "2023-04-03T12:00:00.000Z" },
              { "endDateTime": "2023-04-04T13:00:00.000Z", "startDateTime": "2023-04-04T12:00:00.000Z" },
              { "endDateTime": "2023-04-10T13:00:00.000Z", "startDateTime": "2023-04-10T12:00:00.000Z" },
              { "endDateTime": "2023-04-11T13:00:00.000Z", "startDateTime": "2023-04-11T12:00:00.000Z" },
              { "endDateTime": "2023-04-17T13:00:00.000Z", "startDateTime": "2023-04-17T12:00:00.000Z" },
              { "endDateTime": "2023-04-18T13:00:00.000Z", "startDateTime": "2023-04-18T12:00:00.000Z" },
              { "endDateTime": "2023-04-24T13:00:00.000Z", "startDateTime": "2023-04-24T12:00:00.000Z" },
              { "endDateTime": "2023-04-25T13:00:00.000Z", "startDateTime": "2023-04-25T12:00:00.000Z" },
            ],
            "title": "test-title15", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content16", "freq": "DAILY", "groupId": 1, "id": 16, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-01T00:00:00.000Z", "startDateTime": "2023-03-15T12:00:00.000Z" },
              { "endDateTime": "2023-04-02T00:00:00.000Z", "startDateTime": "2023-03-16T12:00:00.000Z" },
              { "endDateTime": "2023-04-03T00:00:00.000Z", "startDateTime": "2023-03-17T12:00:00.000Z" },
              { "endDateTime": "2023-04-04T00:00:00.000Z", "startDateTime": "2023-03-18T12:00:00.000Z" },
              { "endDateTime": "2023-04-05T00:00:00.000Z", "startDateTime": "2023-03-19T12:00:00.000Z" },
            ],
            "title": "test-title16", "until": "2023-03-20T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content17", "freq": "WEEKLY", "groupId": 1, "id": 17, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-05T00:00:00.000Z", "startDateTime": "2023-03-19T12:00:00.000Z" },
              { "endDateTime": "2023-04-12T00:00:00.000Z", "startDateTime": "2023-03-26T12:00:00.000Z" },
              { "endDateTime": "2023-04-19T00:00:00.000Z", "startDateTime": "2023-04-02T12:00:00.000Z" },
              { "endDateTime": "2023-04-26T00:00:00.000Z", "startDateTime": "2023-04-09T12:00:00.000Z" },
              { "endDateTime": "2023-05-03T00:00:00.000Z", "startDateTime": "2023-04-16T12:00:00.000Z" },
              { "endDateTime": "2023-05-10T00:00:00.000Z", "startDateTime": "2023-04-23T12:00:00.000Z" },
              { "endDateTime": "2023-05-17T00:00:00.000Z", "startDateTime": "2023-04-30T12:00:00.000Z" },
            ],
            "title": "test-title17", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content18", "freq": "MONTHLY", "groupId": 1, "id": 18, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-01T00:00:00.000Z", "startDateTime": "2023-03-15T12:00:00.000Z" },
              { "endDateTime": "2023-05-02T00:00:00.000Z", "startDateTime": "2023-04-15T12:00:00.000Z" },
            ],
            "title": "test-title18", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content19", "freq": "YEARLY", "groupId": 1, "id": 19, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-02T00:00:00.000Z", "startDateTime": "2023-01-15T12:00:00.000Z" },
            ],
            "title": "test-title19", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content21", "freq": "MONTHLY", "groupId": 1, "id": 21, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-05-01T23:59:59.000Z", "startDateTime": "2023-04-30T23:59:59.000Z" },
            ],
            "title": "test-title21", "until": "2025-01-01T00:00:00.000Z",
          },
          {
            "byweekday": "", "content": "test-content23", "freq": "YEARLY", "groupId": 1, "id": 23, "interval": 1, "recurrence": 1,
            "recurrenceDateList": [
              { "endDateTime": "2023-04-01T00:00:00.000Z", "startDateTime": "2023-03-15T00:00:00.000Z" },
            ],
            "title": "test-title23", "until": "2025-01-01T00:00:00.000Z",
          },
        ],
      };
      const res = await request(app).get(`/api/group/${groupID}/calendar`).set('Cookie', cookie).query({
        date,
      });
      expect(res.status).toEqual(200);
      expect(res.body).toEqual(expectedSchedule);
    });
  });
});
