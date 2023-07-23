import { Sequelize, Model } from 'sequelize';
import User from './user';
import Group from './group';

class UserGroup extends Model {
  static initiate(sequelize: Sequelize) {
    UserGroup.init({
    }, {
      sequelize,
      modelName: 'UserGroup',
      tableName: 'UserGroup',
      timestamps: false,
    });
  }

  static associate() {
    User.belongsToMany(Group, {
      through: 'UserGroup',
      foreignKey: 'userId',
      timestamps: false,
    });
    Group.belongsToMany(User, {
      through: 'UserGroup',
      foreignKey: 'groupId',
      timestamps: false,
    });
  }
}

export default UserGroup;
