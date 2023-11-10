const {sequelize} = require('../db_connect')
const {DataTypes} = require('sequelize')


const address = sequelize.define("Address", {
    ID : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    Address : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    RT : {
        type : DataTypes.STRING(3),
    },
    RW : {
        type : DataTypes.STRING(3),
    },
    Village : {
        type : DataTypes.STRING,
    },
    Subdistrict : {
        type : DataTypes.STRING,
    },
    Province : {
        type : DataTypes.STRING,
    },
}, {
    tableName : 'karyawan_address',
    createdAt : false,
    updatedAt : false
})

module.exports = address