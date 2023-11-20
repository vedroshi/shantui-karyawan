const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const ApplicationModel = sequelize.define("Application" , {
    EmployeeID : {
        type : DataTypes.INTEGER,
        primaryKey : true,
        allowNull : false,
        unique : true
    },
    Apply_Date : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    Application_Type : {
        type : DataTypes.ENUM,
        values : ['Cuti', 'Kompensasi', 'Resign'],
        allowNull : true,
        defaultValue : null,
    },
    Application_Status : {
        type : DataTypes.ENUM,
        values : ['Pending', 'Accepted', 'Rejected'],
        allowNull : true,
        defaultValue : null
    },
    Start_Contract : {
        type : DataTypes.DATEONLY
    },
    End_Contract : {
        type : DataTypes.DATEONLY
    },
    Start_Cuti : {
        type : DataTypes.DATEONLY
    },
    End_Cuti : {
        type : DataTypes.DATEONLY
    },
    Depart : {
        type : DataTypes.STRING
    },
    Arrival : {
        type : DataTypes.STRING
    },
    Resign_Date : {
        type : DataTypes.DATEONLY
    }
},{
    tableName : 'karyawan_pengajuan',
    createdAt : false,
    updatedAt : false
})

module.exports = ApplicationModel