const {sequelize} = require('../utils/db_connect')
const {DataTypes} = require('sequelize')

const status = sequelize.define("Status", {
    EmployeeID : {
        type : DataTypes.INTEGER,
        allowNull : false,
        unique : true,
        primaryKey : true,
    },
    Status :{
        type : DataTypes.ENUM,
        allowNull : false,
        values : ['Active' , 'Warning' , 'Resign' , 'Cut Off', 'Cuti' ,'Close Project']
    },
    Start : {
        type : DataTypes.DATEONLY,
        allowNull : false
    },
    End : {
        type : DataTypes.DATEONLY
    },

    Contract_Number : {
        type : DataTypes.STRING
    }
},{
    tableName : 'status_karyawan',
})


module.exports = status