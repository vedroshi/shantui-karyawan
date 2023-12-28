const karyawanModel = require('../models/karyawan.model')
const positionModel = require('../models/position.model')
const statusModel = require('../models/status.model')
const SiteModel = require('../models/site.model')
const companyModel = require('../models/company.model')
const logModel = require('../models/log.model')
const applicationModel = require('../models/application.model')
const LogModel = require('../models/log.model')
const notificationModel = require('../models/notification.model')
const calendarModel = require('../models/calendar.model')
const contractsModel = require('../models/contracts.model')

// Karyawan
karyawanModel.belongsTo(positionModel)
karyawanModel.belongsTo(companyModel)
karyawanModel.hasOne(statusModel, {
    foreignKey : 'EmployeeID'
})
karyawanModel.hasOne(applicationModel, {
    foreignKey : 'EmployeeID'
})

karyawanModel.hasMany(LogModel, {
    foreignKey : 'EmployeeID'
})

karyawanModel.hasMany(contractsModel, {
    foreignKey : 'EmployeeID'
})

// Position
positionModel.hasMany(karyawanModel, {
    foreignKey : "PositionID"
})

// Status
statusModel.belongsTo(karyawanModel, {
    foreignKey : 'EmployeeID'
})


// Site
SiteModel.hasMany(companyModel, {
    foreignKey : "SiteID"
})

// Company
companyModel.hasMany(karyawanModel, {
    foreignKey : "CompanyID"
})
companyModel.belongsTo(SiteModel)

// Application
applicationModel.belongsTo(karyawanModel, {
    foreignKey : "EmployeeID"
})

// Log
logModel.belongsTo(karyawanModel, {
    foreignKey : "EmployeeID"
})

