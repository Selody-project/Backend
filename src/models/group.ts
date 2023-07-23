import {
  Model, Sequelize, DataTypes,
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  CreationOptional,
} from 'sequelize';
import User from './user';
import GroupSchedule from './groupSchedule';

class Group extends Model {
  declare groupId: CreationOptional<number>;

  declare name: string;

  declare member: number;

  declare leader: number;

  declare inviteCode: CreationOptional<string>;

  declare inviteExp: CreationOptional<Date>

  declare addUser: BelongsToManyAddAssociationMixin<User, number>;

  declare getUsers: BelongsToManyGetAssociationsMixin<User>;

  declare hasUser: BelongsToManyHasAssociationMixin<User, number>;

  static initiate(sequelize: Sequelize) {
    Group.init({
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      member: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      leader: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      inviteCode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      inviteExp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      modelName: 'Group',
      tableName: 'groups',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate() {
    Group.hasMany(GroupSchedule, {
      foreignKey: 'groupId',
      onDelete: 'cascade',
    });
  }
}

export default Group;
