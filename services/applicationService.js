const applicationModel = require('../models/application.model')

class ApplicationService{
    async addApplication(karyawan){
        try {
            const application = applicationModel.create({
                EmployeeID : karyawan.ID,
                Application_Date : new Date(),
                Application_Type : null,
                Application_Status : null,
                Start_Contract : null,
                End_Contract : null,
                Start_Cuti : null,
                End_Cuti : null,
                depart : null,
                arrival : null,
                Resign_Date : null
            })
            return application
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = ApplicationService