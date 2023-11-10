const express = require('express')
const bodyParser = require('body-parser')
const {sequelize} = require('./db_connect')

require('dotenv').config()

const app = express()
const karyawanRouter = require('./router/karyawanRouter')
const positionRouter = require('./router/positionRouter')
const addressRouter = require('./router/addressRouter')

const port = process.env.PORT || 3001


app.use(bodyParser.json())
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/karyawan', karyawanRouter)
app.use('/position', positionRouter)
app.use('/address', addressRouter)

const {Position} = require('./models/position.model')
const {Address} = require('./models/address.model')
const {Employee} = require('./models/karyawan.model')

sequelize.sync().then(()=>{
    console.log("Database Synchronized")
}).catch((error)=>{
    console.error(`Error : ${error}`)
})


app.listen(port, ()=>{
    console.log(`Listening to port ${port}`)
})
