const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const contracts = sequelize.define('Contracts', {
    No_Contract : {
        type : DataTypes.INTEGER,
        unique : true,
        autoIncrement :true,
        allowNull : false,
        primaryKey : true,
    },
    EmployeeID : {
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    Start : {
        type : DataTypes.DATEONLY,
        allowNull : false,
    },
    End : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    Signed : {
        type : DataTypes.BOOLEAN,
        defaultValue : false,
        allowNull : false,
    }
}, {
    tableName : 'Contracts',
    updatedAt : false,
    initialAutoIncrement : 300
})

module.exports = contracts