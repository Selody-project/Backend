const { QueryTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('../src/models');

const mockUser = {
  email: 'test-user@email.com',
  nickname: 'test-user',
  password: 'super_strong_password',
};

async function syncDB() {
  await db.sequelize.sync({ force: true });
}

async function setUpUserDB() {
  const mockUserData = [
    'test-user@email.com',
    'test-user',
    await bcrypt.hash('super_strong_password', 12),
    'local',
    '2023-04-26',
    '2023-04-26',
  ];

  await db.sequelize.query(
    `INSERT INTO users
      (email, nickname, password, provider, createdAt, updatedAt)
    VALUES
      (?, ?, ?, ?, ?, ?);`,
    {
      type: QueryTypes.INSERT,
      replacements: [...mockUserData],
    },
  );
}

async function tearDownUserDB() {
  await db.sequelize.query('DELETE FROM users');
}

module.exports = {
  db,
  mockUser,
  setUpUserDB,
  tearDownUserDB,
  syncDB,
};
