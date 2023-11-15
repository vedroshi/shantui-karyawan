const {sequelize} = require('../utils/db_connect')

const {DataTypes} = require('sequelize')

const LogModel = sequelize.define('Log' , {
    EmployeeID :{
        type : DataTypes.INTEGER,
        allowNull : false,
        primaryKey : true,
        unique : true
    },
    CreatedAt : {
        type : DataTypes.DATE,
        allowNull : false
    },
    Message : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Start : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    End : {
        type : DataTypes.DATEONLY
    }
}, {
    tableName : 'log_karyawan',
    createdAt : false,
    updatedAt : false,
})

module.exports = LogModel