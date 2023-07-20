import { Model, DataTypes, Sequelize } from 'sequelize';

export default class User extends Model {
  public userId!: number;

  public email!: string | null;

  public nickname!: string;

  public password!: string | null;

  public provider!: 'local' | 'naver' | 'google';

  public snsId!: string | null;

  addGroup: any;

  getGroups: any;

  hasGroup: any;

  public static initiate(sequelize: Sequelize): void {
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

  static associate(db): void {
    db.User.hasMany(db.PersonalSchedule, {
      foreignKey: 'userId',
      onDelete: 'cascade',
      allowNull: false,
    });
  }
}
