const Sequelize = require('sequelize')

class Group extends Sequelize.Model {
    static initiate(sequelize) {
    Group.init({
        groupId:{
            type:Sequelize.BIGINT,
            primaryKey : true,
            allowNull: false,
        },
        name:{
            type:Sequelize.STRING(45),
            allowNull: false,
        },
        member:{
            type:Sequelize.INTEGER,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Group',
        tableName: 'group',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    })
    }
}

module.exports = Group