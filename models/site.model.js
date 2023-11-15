const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const site = sequelize.define("Site", {
    ID : {
        type : DataTypes.INTEGER,
        allowNull : false,
        autoIncrement : true,
        primaryKey : true
    },
    Name : {
        type : DataTypes.STRING,
        allowNull : false,
        unique : true
    }
}, {
    tableName : "Site",
    updatedAt : false,
    createdAt : false
})

module.exports = site
