const bcrypt = require('bcrypt');
const db = require('../src/models');
const Group = require('../src/models/group');
const GroupSchedule = require('../src/models/groupSchedule');
const User = require('../src/models/user');
const PersonalSchedule = require('../src/models/personalSchedule');

const mockUser = {
  email: 'test-user1@email.com',
  nickname: 'test-user',
  password: 'super_strong_password',
};

async function syncDB() {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: false });
}

async function dropDB() {
  await db.sequelize.drop();
}

async function setUpUserDB() {
  const mockUserData = [
    {
      userId: 1,
      email: 'test-user1@email.com',
      nickname: 'test-user1',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 2,
      email: 'test-user2@email.com',
      nickname: 'test-user2',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 3,
      email: 'test-user3@email.com',
      nickname: 'test-user3',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
  ];

  await User.create(mockUserData[0]);
  await User.create(mockUserData[1]);
  await User.create(mockUserData[2]);
}

async function setUpGroupDB() {
  const group1 = await Group.create({
    groupId: 1,
    name: 'test-group1',
    member: 5,
    leader: 1,
    inviteCode: 'inviteCode01',
    inviteExp: '2099-01-01T00:00:00.000Z',
  });
  const group2 = await Group.create({
    groupId: 2,
    name: 'test-group2',
    member: 6,
    leader: 2,
    inviteCode: 'expiredCode02',
    inviteExp: '2000-01-01T00:00:00.000Z',
  });
  await Group.create({
    groupId: 3,
    name: 'test-group3',
    member: 2,
    leader: 2,
    inviteCode: 'inviteCode03',
    inviteExp: '2099-01-01T00:00:00.000Z',
  });
  const user = await User.findAll();
  await user[0].addGroup(group1);
  await user[0].addGroup(group2);
  await user[1].addGroup(group1);
  await user[1].addGroup(group2);
}

async function setUpGroupScheduleDB() {
  await GroupSchedule.bulkCreate([
    {
      id: 1, groupId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 2, groupId: 1, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 3, groupId: 2, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 4, groupId: 1, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 5, groupId: 1, title: 'test-title5', content: 'test-content5', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 6, groupId: 1, title: 'test-title6', content: 'test-content6', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 7, groupId: 1, title: 'test-title7', content: 'test-content7', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-03-31T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 8, groupId: 1, title: 'test-title8', content: 'test-content8', startDateTime: '2023-05-01T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 9, groupId: 1, title: 'test-title9', content: 'test-content9', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-01T08:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 10, groupId: 1, title: 'test-title10', content: 'test-content10', startDateTime: '2023-04-30T23:59:59.999Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 11, groupId: 1, title: 'test-title11', content: 'test-content11', startDateTime: '2020-01-01T12:00:00.000Z', endDateTime: '2020-01-01T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: '', until: '2023-04-05T14:00:00.000Z', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 12, groupId: 1, title: 'test-title12', content: 'test-content12', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 13, groupId: 1, title: 'test-title13', content: 'test-content13', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 14, groupId: 1, title: 'test-title14', content: 'test-content14', startDateTime: '2020-04-15T12:00:00.000Z', endDateTime: '2020-04-15T13:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 15, groupId: 1, title: 'test-title15', content: 'test-content15', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: 'MO,TU', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 16, groupId: 1, title: 'test-title16', content: 'test-content16', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: '', until: '2023-03-20', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 17, groupId: 1, title: 'test-title17', content: 'test-content17', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 18, groupId: 1, title: 'test-title18', content: 'test-content18', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 19, groupId: 1, title: 'test-title19', content: 'test-content19', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 20, groupId: 1, title: 'test-title20', content: 'test-content20', startDateTime: '2020-01-15T00:00:00.000Z', endDateTime: '2020-01-31T23:59:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 2, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 21, groupId: 1, title: 'test-title21', content: 'test-content21', startDateTime: '2020-04-30T23:59:59.999Z', endDateTime: '2020-05-01T23:59:59.999Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 22, groupId: 1, title: 'test-title22', content: 'test-content22', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-03-31T23:59:59.999Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
    {
      id: 23, groupId: 1, title: 'test-title23', content: 'test-content23', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01', confirmed: 0, possible: 'user1', impossible: 'user3',
    },
  ]);
}

async function setUpPersonalScheduleDB() {
  await PersonalSchedule.bulkCreate([
    {
      id: 1, userId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 2, userId: 1, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 3, userId: 1, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 4, userId: 1, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 5, userId: 1, title: 'test-title5', content: 'test-content5', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 6, userId: 1, title: 'test-title6', content: 'test-content6', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 7, userId: 1, title: 'test-title7', content: 'test-content7', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-03-31T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 8, userId: 1, title: 'test-title8', content: 'test-content8', startDateTime: '2023-05-01T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 9, userId: 1, title: 'test-title9', content: 'test-content9', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-01T08:59:59.999Z', recurrence: 0,
    },
    {
      id: 10, userId: 1, title: 'test-title10', content: 'test-content10', startDateTime: '2023-04-30T23:59:59.999Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 11, userId: 1, title: 'test-title11', content: 'test-content11', startDateTime: '2020-01-01T12:00:00.000Z', endDateTime: '2020-01-01T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: '', until: '2023-04-05T14:00:00.000Z',
    },
    {
      id: 12, userId: 1, title: 'test-title12', content: 'test-content12', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 13, userId: 1, title: 'test-title13', content: 'test-content13', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 14, userId: 1, title: 'test-title14', content: 'test-content14', startDateTime: '2020-04-15T12:00:00.000Z', endDateTime: '2020-04-15T13:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 15, userId: 1, title: 'test-title15', content: 'test-content15', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: 'MO,TU', until: '2025-01-01',
    },
    {
      id: 16, userId: 1, title: 'test-title16', content: 'test-content16', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: '', until: '2023-03-20',
    },
    {
      id: 17, userId: 1, title: 'test-title17', content: 'test-content17', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 18, userId: 1, title: 'test-title18', content: 'test-content18', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 19, userId: 1, title: 'test-title19', content: 'test-content19', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 20, userId: 1, title: 'test-title20', content: 'test-content20', startDateTime: '2020-01-15T00:00:00.000Z', endDateTime: '2020-01-31T23:59:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 2, byweekday: '', until: '2025-01-01',
    },
    {
      id: 21, userId: 1, title: 'test-title21', content: 'test-content21', startDateTime: '2020-04-30T23:59:59.999Z', endDateTime: '2020-05-01T23:59:59.999Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 22, userId: 1, title: 'test-title22', content: 'test-content22', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-03-31T23:59:59.999Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
    {
      id: 23, userId: 1, title: 'test-title23', content: 'test-content23', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: '', until: '2025-01-01',
    },
  ]);
}

async function tearDownUserDB() {
  await db.sequelize.query('DELETE FROM users');
}

async function tearDownGroupDB() {
  await db.sequelize.query('DELETE FROM `groups`');
}

async function tearDownGroupScheduleDB() {
  await db.sequelize.query('DELETE FROM groupSchedule');
}

async function tearDownPersonalScheduleDB() {
  await db.sequelize.query('DELETE FROM personalSchedule');
}

module.exports = {
  db,
  mockUser,
  setUpUserDB,
  setUpGroupDB,
  setUpGroupScheduleDB,
  setUpPersonalScheduleDB,
  tearDownUserDB,
  tearDownGroupDB,
  tearDownGroupScheduleDB,
  tearDownPersonalScheduleDB,
  syncDB,
  dropDB,
};
