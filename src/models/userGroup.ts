import { Model, Sequelize } from 'sequelize';
import User from './user';
import Group from './group';

export default class UserGroup extends Model {
  static initiate(sequelize: Sequelize): void {
    UserGroup.init({
    }, {
      sequelize,
      modelName: 'UserGroup',
      tableName: 'UserGroup',
      timestamps: false,
    });
  }

  static associate(db): void {
    User.belongsToMany(db.Group, { through: 'UserGroup', foreignKey: 'userId', timestamps: false });
    Group.belongsToMany(db.User, { through: 'UserGroup', foreignKey: 'groupId', timestamps: false });
  }
}
