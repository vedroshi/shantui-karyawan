const applicationModel = require('../models/application.model')
const { Op } = require('sequelize')

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

    // Approve application
    async approve(ID){
        try{
            const approved = await applicationModel.update({
                Application_Status : "Accepted"
            },{
                where : {
                    [Op.and] : [
                        {EmployeeID : ID},
                        {Application_Status : "Pending"}
                    ]
                }
            })
            
            // If there is no data updated
            if(approved[0] === 0) {
                throw new Error("Application not Found") 
            }else{
                return approved
            }
        } catch (error){
            throw error
        }
    }

    // Reject application
    async reject(ID){
        try{
            const approved = await applicationModel.update({
                Application_Status : "Rejected"
            },{
                where : {
                    [Op.and] : [
                        {EmployeeID : ID},
                        {Application_Status : "Pending"}
                    ]
                }
            })
            
            // If there is no data updated
            if(approved[0] === 0) {
                throw new Error("Application not Found") 
            }else{
                return approved
            }
        } catch (error){
            throw error
        }
    }
}

module.exports = ApplicationService