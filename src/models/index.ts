import { Sequelize } from 'sequelize';
import { dbConfig } from '../config/config';
import User from './user';
import Group from './group';
import PersonalSchedule from './personalSchedule';
import GroupSchedule from './groupSchedule';
import UserGroup from './userGroup';

const db: any = {};

const sequelize = new Sequelize(
  dbConfig.database, dbConfig.username, dbConfig.password,
  {
    host: dbConfig.host,
    dialect: 'mysql',
    port: dbConfig.port,
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

db.sequelize = sequelize;

db.User = User;
db.Group = Group;
db.PersonalSchedule = PersonalSchedule;
db.GroupSchedule = GroupSchedule;
db.UserGroup = UserGroup;

User.initiate(sequelize);
Group.initiate(sequelize);
PersonalSchedule.initiate(sequelize);
GroupSchedule.initiate(sequelize);
UserGroup.initiate(sequelize);
/*
const basename = path.basename(__filename);
fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
    model.initiate(sequelize);
  });
*/
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export {
  db,
  sequelize,
};
