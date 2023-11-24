const applicationModel = require('../models/application.model')
const { Op } = require('sequelize')

const {getDateObj, displayDate} = require('../utils/utils')
const StatusService = require('./statusService')
const { sequelize } = require('../utils/db_connect')
const LogService = require('./logService')

class ApplicationService{
    // Add application when Karyawan is Added
    async addApplication(ID, t){
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
            }, {transaction : t})
            return application
        }catch(error){
            throw new Error(error)
        }
    }

    // Apply application
    async apply(ID, form){
        try{
            const newApplication = sequelize.transaction(async (t)=>{
                try {
                    const application = await applicationModel.update(form, {
                        where : {
                            EmployeeID : ID
                        },
                        transaction : t
                    })

                    const lservice = new LogService()
                    const logData = {
                        Start : null,
                        End : null,
                        Type : "Apply",
                    }

                    if(form.Application_Type == "Kompensasi"){
                        logData.Start = form.Start_Contract
                        logData.End = form.End_Contract
                        logData.Message = "Ajukan Kompensasi"
                    }

                    if(form.Application_Type == "Cuti"){
                        logData.Start = form.Start_Cuti
                        logData.End = form.End_Cuti
                        logData.Message = `Ajukan Cuti dari Tanggal ${displayDate(logData.Start)} ${logData.End ? `Sampai ${displayDate(logData.End)}`: "" }`
                    }

                    if(form.Application_Type == "Resign"){
                        logData.Start = form.Resign_Date
                        logData.Message = `Ajukan Resign tanggal ${logData.Start}`
                    }
                   
                    await lservice.createLog(ID, logData, t)

                    return application
                }catch(error){
                    throw new Error(error)
                }
            })
            return newApplication
        } catch(error){
            throw error
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
            }
            
            const application = await applicationModel.findOne({
                where : {
                    EmployeeID : ID
                }
            })

            const lService = new LogService()

            await lService.createLog(ID,{
                Start : application.Start_Cuti,
                End : application.End_Cuti,
                Message : `Pengajuan ${application.Application_Type} diSetujui`,
            })

            if(application.Application_Type == "Cuti"){
                // Check if the date is before today
                const sService = new StatusService()

                if(getDateObj(application.Start_Cuti) <= new Date()){
                    await sService.updateStatus(ID, application.Application_Type, application.Start_Cuti, application.End_Cuti)
                    await lService.createLog(ID, {
                        Start : application.Start_Cuti,
                        End : application.End_Cuti,
                        Message : `Mulai Cuti tanggal ${application.Start_Cuti}`,
                        Type : "Cuti"
                    })
                    const currentStatus = {
                        Status : application.Application_Type,
                        Start : application.Start_Cuti,
                        End : application.End_Cuti,
                        message : "Status Changed to Cuti"
                    }   
                    this.clearForm(ID)
                    return currentStatus
                }
            }
            
            if(application.Application_Type == "Resign"){
                const sService = new StatusService()
                if(getDateObj(application.Resign_Date) <= new Date()){
                    //update Status
                    await sService.updateStatus(ID, application.Application_Type, application.Resign_Date, null)
                    await lService.createLog(ID, {
                        Start : application.Resign_Date,
                        Message : `Resign tanggal ${application.Resign_Date}`,
                        Type : "Resign"
                    })
                    const currentStatus = {
                        Status : application.Application_Type,
                        Start : application.Resign_Date,
                        message : "Status Changed to Resign"
                    }   
                    this.clearForm(ID)
                    return currentStatus
                }
            }
            
            return {
                status : "Accepted",
                message : "Application Approved"
            }
        } catch (error){
            throw error
        }
    }
    
    async clearForm(ID){
        try{
            const cleared = await applicationModel.update({
                Application_Type : null,
                Application_Status : null,
                Start_Contract : null,
                End_Contract : null,
                Start_Cuti : null,
                End_Cuti : null,
                Arrival : null,
                Depart : null,
                Resign_Date : null
            },{
                where :  {
                    EmployeeID : ID
                }
            })
            return cleared
        } catch(error){
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

    // Set Return Status
    async setReturn(ID, data){
        try {
            const application = await applicationModel.update(data, {
                where : {
                    EmployeeID : ID
                }
            })

            if(application){
                return application
            }
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = ApplicationService