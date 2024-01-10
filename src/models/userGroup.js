const Sequelize = require("sequelize");
const User = require("./user");
const Group = require("./group");

class UserGroup extends Sequelize.Model {
    static initiate(sequelize) {
        UserGroup.init(
            {
                userId: {
                    type: Sequelize.BIGINT,
                    allowNull: false,
                },
                groupId: {
                    type: Sequelize.BIGINT,
                    allowNull: false,
                },
                shareScheduleOption: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 1,
                },
                notificationOption: {
                    type: Sequelize.TINYINT(1),
                    allowaNull: false,
                    defaultValue: 1,
                },
                isPendingMember: {
                    type: Sequelize.TINYINT(1),
                    allowNull: false,
                    defaultValue: 0,
                },
                accessLevel: {
                    type: Sequelize.ENUM("viewer", "regular", "admin", "owner"),
                    allowNull: false,
                    defaultValue: "viewer",
                },
            },
            {
                sequelize,
                modelName: "UserGroup",
                tableName: "UserGroup",
                timestamps: true,
                updatedAt: false,
                charset: "utf8",
                collate: "utf8_general_ci",
            }
        );
    }

    static associate(db) {
        User.belongsToMany(db.Group, {
            through: "UserGroup",
            foreignKey: "userId",
            timestamps: false,
        });
        Group.belongsToMany(db.User, {
            through: "UserGroup",
            foreignKey: "groupId",
            timestamps: false,
        });
    }
}

module.exports = UserGroup;
