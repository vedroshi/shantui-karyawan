const {sequelize} = require('../utils/db_connect')

const {DataTypes} = require('sequelize')

const salaries = sequelize.define('salary' , {
    ID : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
        allowNull : false
    },
    PositionListID : {
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    Gaji_Pokok : {
        type : DataTypes.INTEGER,
    },
    Upah_Perjam : {
        type : DataTypes.INTEGER,
    },
    Tunjangan : {
        type : DataTypes.INTEGER,
    },
    Uang_Kehadiran : {
        type : DataTypes.INTEGER,
    },
    Overtime : {
        type : DataTypes.INTEGER
    }
}, {
    tableName : 'Salaries',
    createdAt : false,
    updatedAt : false
})

module.exports = salaries