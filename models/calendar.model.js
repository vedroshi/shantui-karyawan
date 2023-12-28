const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const calendar = sequelize.define("Calendar" , {
    ID : {
        autoIncrement : true,
        type : DataTypes.INTEGER,
        allowNull : false,
        primaryKey : true
    },
    Title : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Start : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    Description : {
        type : DataTypes.STRING,
    },
    Tags : {
        type : DataTypes.ENUM,
        allowNull : false,
        values : ['Join' , 'Expired', 'Cuti', 'Return', 'Cut Off', 'Resign', 'Extend']
        // {
        //     Join : "Join Date",
        //     Expired : "End Date",
        //     Cuti : "Start cuti",
        //     Return : "End Cuti",
        //     Cut Off : "Cut Off",
        //     Resign : "Resign",
        //     Extend : "Extend Contract"
        // }
    }
}, {
    tableName : 'calendar'
})

module.exports = calendar