import { Sequelize } from 'sequelize';
import config from '../config/config';
import User from './user';
import Group from './group';
import PersonalSchedule from './personalSchedule';
import GroupSchedule from './groupSchedule';
import UserGroup from './userGroup';

const sequelize = new Sequelize(
  config.database, config.username, config.password,
  {
    host: config.host,
    dialect: 'mysql',
    port: config.port,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
    logging: false,
    // eslint-disable-next-line no-console
    // logging: process.env.NODE_ENV == 'test' ? false : console.log,
  },
);

User.initiate(sequelize);
Group.initiate(sequelize);
PersonalSchedule.initiate(sequelize);
GroupSchedule.initiate(sequelize);
UserGroup.initiate(sequelize);

User.associate();
Group.associate();
PersonalSchedule.associate();
GroupSchedule.associate();
UserGroup.associate();

export {
  User, Group,
  PersonalSchedule, GroupSchedule,
  UserGroup,
  sequelize,
};
