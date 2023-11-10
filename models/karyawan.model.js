const {sequelize} = require('../db_connect')
const {DataTypes} = require('sequelize')

const Position = require('./position.model')
const Address = require('./address.model')


const karyawan = sequelize.define("Employee", {
    ID : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    NIK : {
        type : DataTypes.INTEGER(16),
        unique : true,
        allowNull : false,
    },
    Name : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    DOB : {
        type : DataTypes.DATE,
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
        type : DataTypes.DATE,
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

karyawan.belongsTo(Position)
karyawan.belongsTo(Address)

module.exports = karyawan