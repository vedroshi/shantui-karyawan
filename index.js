const express = require('express')
const bodyParser = require('body-parser')
const {sequelize} = require('./utils/db_connect')
const cors = require('cors')

require('dotenv').config()

const app = express()
const karyawanRouter = require('./router/karyawanRouter')
const positionRouter = require('./router/positionRouter')
const companyRouter = require('./router/companyRouter')

const port = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/karyawan', karyawanRouter)
app.use('/position', positionRouter)
app.use('/company' , companyRouter)

// Load Database Association
require('./utils/db_associations')

sequelize.sync().then(()=>{
    console.log("Database Synchronized")
}).catch((error)=>{
    console.error(`Error : ${error}`)
})


app.listen(port, ()=>{
    console.log(`Listening to port ${port}`)
})
