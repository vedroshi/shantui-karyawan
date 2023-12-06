const {Sequelize} = require('sequelize')
require('dotenv').config()

const DB_Name = process.env.DB_NAME
const DB_Username = process.env.DB_USERNAME
const DB_Password = process.env.DB_PASSWORD

const sequelize = new Sequelize(DB_Name, DB_Username, DB_Password, {
    host : process.env.DB_HOST || '127.0.0.1',
    dialect : 'mysql',
})

sequelize.authenticate().then(()=>{
    console.info("Connection is Successfully Established")
}).catch((error)=>{
    console.error('Unable to connect to the database: ', error)
})


module.exports = {sequelize}