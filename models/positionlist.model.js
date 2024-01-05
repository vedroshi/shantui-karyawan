const {sequelize} = require('../utils/db_connect')

const {DataTypes} = require('sequelize')

const positionLists = sequelize.define('positionList', {
    ID : {
        type : DataTypes.INTEGER,
        allowNull : false,
        autoIncrement : true,
        primaryKey : true
    },
    Position_Name : {
        type : DataTypes.STRING,
        allowNull : false
    },
    Min_Tonnage : {
        type : DataTypes.INTEGER,
    },
    Max_Tonnage : {
        type : DataTypes.INTEGER,
    }
}, {
    tableName : 'position_list',
    createdAt : false,
    updatedAt : false
})

module.exports = positionLists