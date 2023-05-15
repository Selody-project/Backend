const bcrypt = require('bcrypt');
const db = require('../src/models');
const Group = require('../src/models/group');
const GroupSchedule = require('../src/models/groupSchedule');
const User = require('../src/models/user');
const PersonalSchedule = require('../src/models/personalSchedule');

const mockUser = {
  email: 'test-user@email.com',
  nickname: 'test-user',
  password: 'super_strong_password',
};

async function syncDB() {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: false }).then(() => {
    console.log('DB Connection has been established successfully.');
  }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
  });
}

async function dropDB() {
  await db.sequelize.drop();
}

async function setUpUserDB() {
  const mockUserData = {
    userId: 1,
    email: 'test-user@email.com',
    nickname: 'test-user',
    password: await bcrypt.hash('super_strong_password', 12),
    provider: 'local',
    createdAt: '2023-04-26',
    updatedAt: '2023-04-26',
  };

  await User.create(mockUserData);
}

async function setUpGroupDB() {
  const group1 = await Group.create({
    groupId: 1,
    name: 'test-group',
    member: 5,
  });
  const group2 = await Group.create({
    groupId: 2,
    name: 'test-group',
    member: 6,
  });
  const user = await User.findAll();
  await user[0].addGroup(group1);
  await user[0].addGroup(group2);
}

async function setUpGroupScheduleDB() {
  await GroupSchedule.bulkCreate([
    {
      id: 1, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-02-03', endDate: '2023-05-15', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 2, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-04-16', endDate: '2023-04-30', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 3, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-04-01', endDate: '2023-04-15', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 4, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-02-03', endDate: '2023-03-15', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 5, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-04-01', endDate: '2023-04-30', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 6, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-03-01', endDate: '2023-04-15', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 7, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-08-01', endDate: '2023-08-30', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 8, groupId: 1, title: 'test-title', content: 'test-content', startDate: '2023-04-15', endDate: '2023-05-15', repeat: 0, confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 9, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-02-03', endDate: '2021-02-03', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 10, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2023-04-15', endDate: '2023-04-20', repeat: 1, dayMonth: '*', month: '*', dayWeek: '1', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 11, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2023-05-06', endDate: '2023-05-08', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 12, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-01-15', endDate: '2021-01-15', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 13, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-01-15', endDate: '2021-01-15', repeat: 1, dayMonth: '15', month: '1', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 14, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2025-05-15', endDate: '2025-05-16', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 15, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-02-15', endDate: '2021-02-15', repeat: 1, dayMonth: '2', month: '2', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 16, groupId: 2, title: 'test-title', content: 'test-content1', startDate: '2021-02-15', endDate: '2021-02-15', repeat: 1, dayMonth: '2', month: '2', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 17, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2023-03-15', endDate: '2023-05-15', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 18, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2023-03-15', endDate: '2023-05-15', repeat: 1, dayMonth: '*', month: '*', dayWeek: '1', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 19, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-03-15', endDate: '2021-05-15', repeat: 1, dayMonth: '15', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 20, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-03-15', endDate: '2021-05-15', repeat: 1, dayMonth: '15', month: '3', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 21, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2023-04-15', endDate: '2023-04-20', repeat: 1, dayMonth: '15', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
  ]);
}

async function setUpPersonalScheduleDB() {
  await PersonalSchedule.bulkCreate([
    {
      id: 1, title: 'test-title', content: 'test-content1', startDate: '2023-02-03', endDate: '2023-05-15', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 2, title: 'test-title', content: 'test-content1', startDate: '2023-04-16', endDate: '2023-04-30', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 3, title: 'test-title', content: 'test-content1', startDate: '2023-04-01', endDate: '2023-04-15', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 4, title: 'test-title', content: 'test-content1', startDate: '2023-02-03', endDate: '2023-03-15', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 5, title: 'test-title', content: 'test-content1', startDate: '2023-03-01', endDate: '2023-04-15', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 6, title: 'test-title', content: 'test-content1', startDate: '2023-08-01', endDate: '2023-08-30', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 7, title: 'test-title', content: 'test-content1', startDate: '2023-04-01', endDate: '2023-04-30', repeat: 0, repeatType: '1', userId: 1,
    },
    {
      id: 8, title: 'test-title', content: 'test-content1', startDate: '2023-04-15', endDate: '2023-05-15', repeat: 0, repeatType: '1', userId: 1,
    },
  ]);
}

async function setUpGroupScheduleDB2() {
  await GroupSchedule.bulkCreate([
    {
      id: 1, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-02-03', endDate: '2021-02-03', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 2, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-03-16', endDate: '2021-03-16', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 3, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-02-03', endDate: '2021-02-04', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 4, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-01-15', endDate: '2021-01-15', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 5, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-01-15', endDate: '2021-01-15', repeat: 1, dayMonth: '15', month: '1', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 6, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-05-15', endDate: '2021-05-16', repeat: 1, dayMonth: '*', month: '*', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 7, groupId: 1, title: 'test-title', content: 'test-content1', startDate: '2021-02-15', endDate: '2021-02-15', repeat: 1, dayMonth: '2', month: '2', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
    },
    {
      id: 8, groupId: 2, title: 'test-title', content: 'test-content1', startDate: '2021-02-15', endDate: '2021-02-15', repeat: 1, dayMonth: '2', month: '2', dayWeek: '*', confirmed: 0, possible: '["user1"]', impossible: '["user3"]',
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
  setUpGroupScheduleDB2,
  tearDownUserDB,
  tearDownGroupDB,
  tearDownGroupScheduleDB,
  tearDownPersonalScheduleDB,
  syncDB,
  dropDB,
};
