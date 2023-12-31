const express = require('express')
const bodyParser = require('body-parser')
const {sequelize} = require('./utils/db_connect')
const cors = require('cors')
const expressWinston = require('express-winston')
const logger = require('./utils/logger')

require('dotenv').config()

const app = express()
const karyawanRouter = require('./router/karyawanRouter')
const positionRouter = require('./router/positionRouter')
const companyRouter = require('./router/companyRouter')
const applicationRouter = require('./router/applicationRouter')
const statusRouter = require('./router/status.Router')
const logRouter = require('./router/logRouter')
const notificationRouter = require('./router/notificationRouter')
const calendarRouter = require('./router/calendarRouter')
const contractRouter = require('./router/contractRouter')

const port = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(expressWinston.logger({
    winstonInstance : logger,
    statuslevels : true
}))

app.use('/karyawan', karyawanRouter)
app.use('/position', positionRouter)
app.use('/company' , companyRouter)
app.use('/apply' , applicationRouter)
app.use('/status', statusRouter)
app.use('/logs', logRouter)
app.use('/notif', notificationRouter)
app.use('/calendar', calendarRouter)
app.use('/contract', contractRouter)

// Load Database Association
require('./utils/db_associations')

// Load Scheduler
require('./utils/scheduler')


sequelize.sync()
.then(()=>{
    console.log("Database Synchronized")
}).catch((error)=>{
    console.error(`Error : ${error}`)
})


app.listen(port, ()=>{
    console.log(`Listening to port ${port}`)
})
