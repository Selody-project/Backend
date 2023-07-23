import {
  Model, Sequelize, DataTypes,
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  CreationOptional,
} from 'sequelize';
import Group from './group';
import PersonalSchedule from './personalSchedule';

class User extends Model {
  declare userId: CreationOptional<number>;

  declare email: string;

  declare nickname: string;

  declare password: string;

  declare provider: 'local' | 'naver' | 'google';

  declare snsId: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;

  declare updatedAt: CreationOptional<Date>;

  declare addGroup: BelongsToManyAddAssociationMixin<Group, number>;

  declare getGroups: BelongsToManyGetAssociationsMixin<Group>;

  declare hasGroup: BelongsToManyHasAssociationMixin<Group, number>;

  static initiate(sequelize: Sequelize) {
    User.init({
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: true,
      },
      nickname: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      provider: {
        type: DataTypes.ENUM('local', 'naver', 'google'),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate() {
    User.hasMany(PersonalSchedule, {
      foreignKey: 'userId',
      onDelete: 'cascade',
    });
  }
}

export default User;
