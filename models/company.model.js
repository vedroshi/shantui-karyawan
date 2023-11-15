const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const company = sequelize.define("Company" , {
    ID:  {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey: true
    },
    Name : {
        type : DataTypes.STRING,
        allowNull : false
    },
},{
    tableName : "Company",
    updatedAt : false,
    createdAt : false
})

module.exports = company