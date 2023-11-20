const applicationModel = require('../models/application.model')

class ApplicationService{
    // Add application when Karyawan is Added
    async addApplication(ID){
        try {
            const application = applicationModel.create({
                EmployeeID : ID,
                Apply_Date : new Date(),
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

    // Apply application
    async apply(ID, form){
        try{
            const application = await applicationModel.update(form, {
                where : {
                    EmployeeID : ID
                }
            })
            return application
        } catch(error){
            throw new Error(error)
        }
        
    }
}

module.exports = ApplicationService