const { createLogger, format, transports } = require('winston')
const fs = require('fs')
const path = require('path')

const logDir = path.join(__dirname, '../logger');
if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir)
}

const logger = createLogger({
    transports : [
        new transports.Console(),
        new transports.File({
            filename : path.join(logDir, 'karyawaninfo.log'),
            level : 'info',
        }),
        new transports.File({
            filename : path.join(logDir, 'karyawanwarn.log'),
            level : 'warn'
        }),
        new transports.File({
            filename : path.join(logDir, 'karyawanerror.log'),
            level : 'error',
        })
    ],
    format : format.combine(
        format.timestamp(),
        format.prettyPrint(),
        format.printf((info) => `{ message: ${JSON.stringify(info.message)}, level: '${info.level}', timestamp: '${info.timestamp}' }`)
    ),
})

module.exports = logger