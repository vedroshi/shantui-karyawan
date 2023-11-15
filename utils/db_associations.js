const karyawanModel = require('../models/karyawan.model')
const addressModel = require('../models/address.model')
const positionModel = require('../models/position.model')
const statusModel = require('../models/status.model')
const SiteModel = require('../models/site.model')
const companyModel = require('../models/company.model')
const logModel = require('../models/log.model')
const applicationModel = require('../models/application.model')
const ApplicationModel = require('../models/application.model')


// Karyawan
karyawanModel.belongsTo(addressModel)
karyawanModel.belongsTo(positionModel)
karyawanModel.belongsTo(companyModel)
karyawanModel.hasOne(statusModel, {
    foreignKey : 'EmployeeID'
})
karyawanModel.hasOne(ApplicationModel, {
    foreignKey : 'EmployeeID'
})


// Address
addressModel.hasMany(karyawanModel, {
    foreignKey : "AddressID",
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
