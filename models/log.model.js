const {sequelize} = require('../utils/db_connect')

const {DataTypes} = require('sequelize')

const LogModel = sequelize.define('Log' , {
    ID : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
        allowNull : false
    },
    EmployeeID :{
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    CreatedAt : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    Message : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Start : {
        type : DataTypes.DATEONLY,
    },
    End : {
        type : DataTypes.DATEONLY
    },
    Type : {
        type : DataTypes.ENUM("Contract", "Apply", "Cuti", "Resign", "Accept", "Reject", "Edit", "Return", "Cut Off"),
        allowNull : true
    }
}, {
    tableName : 'log_karyawan',
    createdAt : false,
    updatedAt : false,
})

module.exports = LogModel