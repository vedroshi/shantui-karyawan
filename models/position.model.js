const {sequelize} = require('../db_connect')
const {DataTypes} = require('sequelize')


const positions = sequelize.define("Position",{
        ID: {
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true,
        },
        Name : {
            type : DataTypes.STRING,
            allowNull : false,
        },
        Tonnage : {
            type : DataTypes.INTEGER,
        }
    },
    {
        tableName : 'karyawan_position',
        createdAt : false,
        updatedAt : false
    }
)


module.exports = positions