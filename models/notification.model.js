const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const notifications = sequelize.define("Notification", {
    ID : {
        primaryKey: true,
        autoIncrement : true,
        type : DataTypes.INTEGER
    },
    UserID : {
        type : DataTypes.INTEGER,
        allowNull : true,
        // To be Changed (If there is more than one user)
    },
    Title : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Description : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Details : {
        type : DataTypes.TEXT,
    },
    IsRead : {
        type : DataTypes.BOOLEAN,
        allowNull : false,
        defaultValue : 0,
    }
}, {
    tableName : "notification",
})

module.exports = notifications