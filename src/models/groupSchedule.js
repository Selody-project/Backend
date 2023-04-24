const Sequelize = require('sequelize')

class GroupSchedule extends Sequelize.Model {
    static initiate(sequelize) {
        GroupSchedule.init({
        id:{
            type:Sequelize.BIGINT,
            primaryKey
        },
        groupId:{
            type:Sequelize.BIGINT,
            primaryKey : true,
            allowNull: false,
        },
        title:{
            type:Sequelize.STRING(45),
            allowNull: false,
        },
        content:{
            type:Sequelize.STRING(45),
            allowNull: true,
        },
        startDate:{
            type:Sequelize.DATE,
            allowNull:false,
        },
        endDate:{
            type:Sequelize.DATE,
            allowNull:false,
        },
        repeat:{
            type:Sequelize.INTEGER,
            allowNull:false,
        },
        repeatType:{
            type:Sequelize.ENUM('year', 'month', 'week'),
            allowNull:true,
        },
        confirmed:{
            type:Sequelize.INTEGER,
            allowNull: false,
        },
        possible:{
            type:JSON,
            allowNull:true,
        },
        impossible:{
            type:JSON,
            allowNull:true,
        }
    }, {
        sequelize,
        timestamps: true,
        modelName: 'GroupSchedule',
        tableName: 'groupSchedule',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    })
    }
}

module.exports = GroupSchedule