const bcrypt = require('bcrypt');
const db = require('../src/models');
const Group = require('../src/models/group');
const GroupSchedule = require('../src/models/groupSchedule');
const User = require('../src/models/user');
const PersonalSchedule = require('../src/models/personalSchedule');
const Post = require('../src/models/post');
const Comment = require('../src/models/comment');
const Like = require('../src/models/like');
const Vote = require('../src/models/vote');
const VoteResult = require('../src/models/voteResult');

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
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 2,
      email: 'test-user2@email.com',
      nickname: 'test-user2',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 3,
      email: 'test-user3@email.com',
      nickname: 'test-user3',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 4,
      email: 'test-user4@email.com',
      nickname: 'test-user4',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 5,
      email: 'test-user5@email.com',
      nickname: 'test-user5',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },
    {
      userId: 6,
      email: 'test-user6@email.com',
      nickname: 'test-user6',
      password: await bcrypt.hash('super_strong_password', 12),
      provider: 'local',
      profileImage: 'profileImageLink',
      createdAt: '2023-04-26',
      updatedAt: '2023-04-26',
    },

  ];

  await User.create(mockUserData[0]);
  await User.create(mockUserData[1]);
  await User.create(mockUserData[2]);
  await User.create(mockUserData[3]);
  await User.create(mockUserData[4]);
  await User.create(mockUserData[5]);
}

async function setUpGroupDB() {
  const group1 = await Group.create({
    groupId: 1,
    name: 'test-group1',
    description: 'test-description1',
    member: 2,
    leader: 1,
    inviteCode: 'inviteCode01',
    inviteExp: '2099-01-01T00:00:00.000Z',
    image: 'groupImageLink',
  });
  const group2 = await Group.create({
    groupId: 2,
    name: 'test-group2',
    description: 'test-description2',
    member: 6,
    leader: 2,
    inviteCode: 'expiredCode02',
    inviteExp: '2000-01-01T00:00:00.000Z',
    image: 'groupImageLink',
  });
  const group3 = await Group.create({
    groupId: 3,
    name: 'test-group3',
    description: 'test-description3',
    member: 1,
    leader: 3,
    inviteCode: 'inviteCode03',
    inviteExp: '2099-01-01T00:00:00.000Z',
    image: 'groupImageLink',
  });
  const group4 = await Group.create({
    groupId: 4,
    name: 'test-group4',
    description: 'test-description4',
    member: 2,
    leader: 3,
    inviteCode: 'inviteCode04',
    inviteExp: '2099-01-01T00:00:00.000Z',
    image: 'groupImageLink',
  });

  const user = await User.findAll();
  await user[0].addGroup(group1, {
    through: {
      accessLevel: 'owner', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[0].addGroup(group2, {
    through: {
      accessLevel: 'regular', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[0].addGroup(group3, {
    through: {
      accessLevel: 'viewer', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 1,
    },
  });
  await user[1].addGroup(group1, {
    through: {
      accessLevel: 'admin', shareScheduleOption: 0, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[1].addGroup(group2, {
    through: {
      accessLevel: 'owner', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[2].addGroup(group3, {
    through: {
      accessLevel: 'owner', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[4].addGroup(group1, {
    through: {
      accessLevel: 'viewer', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 1,
    },
  });
  await user[4].addGroup(group3, {
    through: {
      accessLevel: 'admin', shareScheduleOption: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
  await user[4].addGroup(group4, {
    through: {
      accessLevel: 'admin', sharePersonalEvent: 1, notificationOption: 1, isPendingMember: 0,
    },
  });
}

async function setUpGroupScheduleDB() {
  await GroupSchedule.bulkCreate([
    {
      id: 1, groupId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 2, groupId: 1, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 3, groupId: 2, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 4, groupId: 1, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 5, groupId: 1, title: 'test-title5', content: 'test-content5', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 6, groupId: 1, title: 'test-title6', content: 'test-content6', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 7, groupId: 1, title: 'test-title7', content: 'test-content7', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-03-31T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 8, groupId: 1, title: 'test-title8', content: 'test-content8', startDateTime: '2023-05-01T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 9, groupId: 1, title: 'test-title9', content: 'test-content9', startDateTime: '2023-03-15T00:00:00.000Z', endDateTime: '2023-04-01T08:59:59.999Z', recurrence: 0,
    },
    {
      id: 10, groupId: 1, title: 'test-title10', content: 'test-content10', startDateTime: '2023-04-30T23:59:59.999Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 11, groupId: 1, title: 'test-title11', content: 'test-content11', startDateTime: '2020-01-01T12:00:00.000Z', endDateTime: '2020-01-01T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: null, until: '2023-04-05T14:00:00.000Z',
    },
    {
      id: 12, groupId: 1, title: 'test-title12', content: 'test-content12', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 13, groupId: 1, title: 'test-title13', content: 'test-content13', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [3], until: '2025-01-01',
    },
    {
      id: 14, groupId: 1, title: 'test-title14', content: 'test-content14', startDateTime: '2020-04-15T12:00:00.000Z', endDateTime: '2020-04-15T13:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 15, groupId: 1, title: 'test-title15', content: 'test-content15', startDateTime: '2020-01-13T12:00:00.000Z', endDateTime: '2020-01-13T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [1, 2], until: '2025-01-01',
    },
    {
      id: 16, groupId: 1, title: 'test-title16', content: 'test-content16', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: null, until: '2023-03-20',
    },
    {
      id: 17, groupId: 1, title: 'test-title17', content: 'test-content17', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [0], until: '2025-01-01',
    },
    {
      id: 18, groupId: 1, title: 'test-title18', content: 'test-content18', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 19, groupId: 1, title: 'test-title19', content: 'test-content19', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 20, groupId: 1, title: 'test-title20', content: 'test-content20', startDateTime: '2020-01-15T00:00:00.000Z', endDateTime: '2020-01-31T23:59:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 2, byweekday: null, until: '2025-01-01',
    },
    {
      id: 21, groupId: 1, title: 'test-title21', content: 'test-content21', startDateTime: '2020-04-30T23:59:59.999Z', endDateTime: '2020-05-01T23:59:59.999Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 22, groupId: 1, title: 'test-title22', content: 'test-content22', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-03-31T23:59:59.999Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 23, groupId: 1, title: 'test-title23', content: 'test-content23', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
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
      id: 11, userId: 1, title: 'test-title11', content: 'test-content11', startDateTime: '2020-01-01T12:00:00.000Z', endDateTime: '2020-01-01T13:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: null, until: '2023-04-05T14:00:00.000Z',
    },
    {
      id: 12, userId: 1, title: 'test-title12', content: 'test-content12', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 13, userId: 1, title: 'test-title13', content: 'test-content13', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-01-15T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [3], until: '2025-01-01',
    },
    {
      id: 14, userId: 1, title: 'test-title14', content: 'test-content14', startDateTime: '2020-04-15T12:00:00.000Z', endDateTime: '2020-04-15T13:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 15, userId: 1, title: 'test-title15', content: 'test-content15', startDateTime: '2020-01-13T12:00:00.000Z', endDateTime: '2020-01-13T13:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [1, 2], until: '2025-01-01',
    },
    {
      id: 16, userId: 1, title: 'test-title16', content: 'test-content16', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'DAILY', interval: 1, byweekday: null, until: '2023-03-20',
    },
    {
      id: 17, userId: 1, title: 'test-title17', content: 'test-content17', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'WEEKLY', interval: 1, byweekday: [0], until: '2025-01-01',
    },
    {
      id: 18, userId: 1, title: 'test-title18', content: 'test-content18', startDateTime: '2020-03-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 19, userId: 1, title: 'test-title19', content: 'test-content19', startDateTime: '2020-01-15T12:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 20, userId: 1, title: 'test-title20', content: 'test-content20', startDateTime: '2020-01-15T00:00:00.000Z', endDateTime: '2020-01-31T23:59:00.000Z', recurrence: 1, freq: 'MONTHLY', interval: 2, byweekday: null, until: '2025-01-01',
    },
    {
      id: 21, userId: 1, title: 'test-title21', content: 'test-content21', startDateTime: '2020-04-30T23:59:59.999Z', endDateTime: '2020-05-01T23:59:59.999Z', recurrence: 1, freq: 'MONTHLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 22, userId: 1, title: 'test-title22', content: 'test-content22', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-03-31T23:59:59.999Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 23, userId: 1, title: 'test-title23', content: 'test-content23', startDateTime: '2020-03-15T00:00:00.000Z', endDateTime: '2020-04-01T00:00:00.000Z', recurrence: 1, freq: 'YEARLY', interval: 1, byweekday: null, until: '2025-01-01',
    },
    {
      id: 24, userId: 2, title: 'test-title24', content: 'test-content24', startDateTime: '3000-03-15T00:00:00.000Z', endDateTime: '3000-04-01T00:00:00.000Z', recurrence: 0,
    },
  ]);
}

async function setUpPersonalScheduleDB2() {
  await PersonalSchedule.bulkCreate([
    {
      id: 1, userId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 2, userId: 1, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 3, userId: 2, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 4, userId: 2, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 5, userId: 3, title: 'test-title5', content: 'test-content5', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 6, userId: 1, title: 'test-title6', content: 'test-content6', startDateTime: '2000-04-01T08:00:00.000Z', endDateTime: '2000-04-01T09:30:00.000Z', recurrence: 0,
    },
    {
      id: 7, userId: 1, title: 'test-title7', content: 'test-content7', startDateTime: '2000-04-01T13:00:00.000Z', endDateTime: '2000-04-01T18:00:00.000Z', recurrence: 0,
    },
    {
      id: 8, userId: 2, title: 'test-title8', content: 'test-content8', startDateTime: '2000-04-01T21:00:00.000Z', endDateTime: '2000-04-01T22:40:00.000Z', recurrence: 0,
    },
    {
      id: 9, userId: 2, title: 'test-title9', content: 'test-content9', startDateTime: '2000-04-01T23:30:00.000Z', endDateTime: '2000-04-02T01:00:00.000Z', recurrence: 0,
    },
    {
      id: 10, userId: 2, title: 'test-title10', content: 'test-content10', startDateTime: '2000-04-01T20:30:00.000Z', endDateTime: '2000-04-01T22:00:00.000Z', recurrence: 0,
    },
    {
      id: 11, userId: 2, title: 'test-title11', content: 'test-content11', startDateTime: '2000-03-31T23:00:00.000Z', endDateTime: '2000-04-01T06:00:00.000Z', recurrence: 0,
    },
  ]);
}

async function setUpGroupScheduleDB2() {
  await GroupSchedule.bulkCreate([
    {
      id: 1, groupId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 2, groupId: 1, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 3, groupId: 2, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0,
    },
    {
      id: 4, groupId: 3, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0,
    },
  ]);
}

async function setUpGroupPostDB() {
  await Post.bulkCreate([
    {
      postId: 1, userId: 1, groupId: 1, author: 'test-user1', content: 'test-content1', image: 'postImage',
    },
    {
      postId: 2, userId: 2, groupId: 1, author: 'test-user2', content: 'test-content2', image: 'postImage',
    },
    {
      postId: 3, userId: 1, groupId: 1, author: 'test-user1', content: 'test-content3', image: 'postImage',
    },
    {
      postId: 4, userId: 1, groupId: 1, author: 'test-user1', content: 'test-content4', image: 'postImage',
    },
    {
      postId: 5, userId: 1, groupId: 1, author: 'test-user1', content: 'test-content5', image: 'postImage',
    },
    {
      postId: 6, userId: 2, groupId: 2, author: 'test-user2', content: 'test-content6', image: 'postImage',
    },
    {
      postId: 7, userId: 2, groupId: 1, author: 'test-user2', content: 'test-content7', image: 'postImage',
    },
    {
      postId: 8, userId: 2, groupId: 1, author: 'test-user2', content: 'test-content8', image: 'postImage',
    },
    {
      postId: 9, userId: 1, groupId: 2, author: 'test-user1', content: 'test-content9', image: 'postImage',
    },
    {
      postId: 10, userId: 1, groupId: 1, author: 'test-user1', content: 'test-content10', image: 'postImage',
    },
  ]);

  await Comment.bulkCreate([
    {
      commentId: 1, postId: 1, userId: 1, content: 'test-comment1',
    },
    {
      commentId: 2, postId: 1, userId: 1, content: 'test-comment2',
    },
    {
      commentId: 3, postId: 1, userId: 2, content: 'test-comment3',
    },
    {
      commentId: 4, postId: 1, userId: 2, content: 'test-comment4',
    },
  ]);
}

async function setUpLikeDB() {
  await Like.bulkCreate([
    {
      id: 1, postId: 2, userId: 1,
    },
    {
      id: 2, postId: 3, userId: 1,
    },
    {
      id: 3, postId: 2, userId: 2,
    },
  ]);
}

async function setUpVoteDB() {
  await Vote.bulkCreate([
    {
      voteId: 1, title: 'test-title1', content: 'test-content1', startDateTime: '2023-02-03T00:00:00.000Z', endDateTime: '2023-05-15T23:59:59.999Z', recurrence: 0, groupId: 1, votingEndDate: '2023-12-01T00:00:00.000Z',
    },
    {
      voteId: 2, title: 'test-title2', content: 'test-content2', startDateTime: '2023-04-15T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0, groupId: 1, votingEndDate: '2023-12-01T00:00:00.000Z',
    },
    {
      voteId: 3, title: 'test-title3', content: 'test-content3', startDateTime: '2023-04-10T00:00:00.000Z', endDateTime: '2023-04-15T23:59:59.999Z', recurrence: 0, groupId: 1, votingEndDate: '2023-12-01T00:00:00.000Z',
    },
    {
      voteId: 4, title: 'test-title4', content: 'test-content4', startDateTime: '2023-04-01T00:00:00.000Z', endDateTime: '2023-04-30T23:59:59.999Z', recurrence: 0, groupId: 1, votingEndDate: '2023-12-01T00:00:00.000Z',
    },
  ]);
}

async function setUpVoteResultDB() {
  await VoteResult.bulkCreate([
    {
      resultId: 1, choice: true, userId: 1, voteId: 1,
    },
    {
      resultId: 2, choice: true, userId: 1, voteId: 2,
    },
    {
      resultId: 3, choice: true, userId: 1, voteId:3,
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

async function tearDownGroupPostDB() {
  await db.sequelize.query('DELETE FROM `comments`');
  await db.sequelize.query('DELETE FROM `posts`');
}

async function tearDownLikeDB() {
  await db.sequelize.query('DELETE FROM `like`');
}

async function tearDownVoteDB() {
  await db.sequelize.query('DELETE FROM votes');
}

async function tearDownVoteResultDB() {
  await db.sequelize.query('DELETE FROM voteResults');
}

module.exports = {
  db,
  mockUser,
  setUpUserDB,
  setUpGroupDB,
  setUpGroupScheduleDB,
  setUpPersonalScheduleDB,
  setUpPersonalScheduleDB2,
  setUpGroupScheduleDB2,
  setUpGroupPostDB,
  setUpLikeDB,
  setUpVoteDB,
  setUpVoteResultDB,
  tearDownUserDB,
  tearDownGroupDB,
  tearDownGroupScheduleDB,
  tearDownPersonalScheduleDB,
  tearDownGroupPostDB,
  tearDownLikeDB,
  tearDownVoteDB,
  tearDownVoteResultDB,
  syncDB,
  dropDB,
};
