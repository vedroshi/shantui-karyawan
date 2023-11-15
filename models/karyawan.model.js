const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const karyawan = sequelize.define("Employee", {
    ID : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    NIK : {
        type : DataTypes.BIGINT.UNSIGNED,
        unique : true,
        allowNull : false,
    },
    Name : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    DOB : {
        type : DataTypes.DATEONLY,
        allowNull : false,
    },
    POB : {
        type : DataTypes.STRING,
        allowNull : false
    },
    Religion : {
        type : DataTypes.STRING,
        allowNull : false
    },
    Join_Date : {
        type : DataTypes.DATEONLY,
        allowNull : false,
    },
    KTP : {
        type : DataTypes.TEXT,
    }
},{
    tableName : 'karyawan',
    createdAt : false,
    updatedAt : false,
})

module.exports = karyawan