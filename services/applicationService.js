const applicationModel = require('../models/application.model')
const { Op } = require('sequelize')

const {getDateObj, displayDate, formatDate, revertDate} = require('../utils/utils')
const { sequelize } = require('../utils/db_connect')

const StatusService = require('./statusService')
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

    async getApplication(ID, t=null){
        try{
            const application = applicationModel.findOne({
                where : {
                    EmployeeID : ID
                },
                transaction : t
            })

            return application
        }catch(error){
            throw new Error(error)
        }
    }

    // Apply application
    async apply(ID, form){
        try{
        
            const lservice = new LogService()
            const currentApplication = await this.getApplication(ID)
            const newApplication = sequelize.transaction(async (t)=>{
                try {
                    const logData = {
                        CreatedAt : formatDate(new Date()),
                        Start : null,
                        End : null,
                        Type : "Apply",
                    }

                    const areFormsEqual = Object.keys(form).every((key) => {
                        return currentApplication[key] === form[key];
                    });
    
                    if (areFormsEqual) {
                        throw new Error("Form Does not Change");
                    }
                   
                    const application = await applicationModel.update(form, {
                        where : {
                            EmployeeID : ID
                        },
                        transaction : t
                    })
                  

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

                    if(currentApplication.Application_Status == "Pending"){
                        var changedForm = [];
                        for(const attr of Object.keys(currentApplication.dataValues)){
                            if(currentApplication.dataValues[attr] != form[attr]){
                                changedForm.push(attr)
                            }
                        }
                        
                        if(changedForm.includes('Start_Cuti')){
                            logData.Message = `Ganti Mulai Cuti menjadi ${displayDate(form.Start_Cuti)}`
                        }

                        if(changedForm.includes('End_Cuti')){
                            logData.Message = `Undur Balik Cuti menjadi ${displayDate(form.End_Cuti)}`
                            if(form.End_Cuti == null){
                                logData.Message = `Perpanjang Cuti`
                            }
                        }

                        if(changedForm.includes('Depart') || changedForm.includes('Arrival') && !changedForm.includes('Start_Cuti')){
                            logData.Message = `${form.Depart && form.Arrival ? `Ganti Destinasi dari ${form.Depart} ke ${form.Arrival}` : `Tidak Jadi Berangkat`}`
                        }

                        if(changedForm.includes('Resign_Date')){
                            logData.Message = `Ganti tanggal Resign menjadi ${form.Resign_Date}`
                        }

                        if(changedForm.includes('Application_Type')){
                            logData.Message = `Ganti pengajuan dari ${currentApplication.dataValues.Application_Type} menjadi ${form.Application_Type}`
                        }

                        logData.Type = "Edit"
                    }

                    await lservice.createLog(ID, logData, t)

                    return {application, logData}
                }catch(error){
                    throw error
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
            const updated = sequelize.transaction(async (t) => {
                try{
                    const lService = new LogService()
                    const sService = new StatusService()
                    const logUpdates = []

                    const approved = await applicationModel.update({
                        Application_Status : "Accepted"
                    },{
                        where : {
                            [Op.and] : [
                                {EmployeeID : ID},
                                {Application_Status : "Pending"}
                            ]
                        },
                        transaction : t
                    })

                    // If there is no data updated
                    if(approved[0] === 0) {
                        throw new Error("Application not Found") 
                    }
                    
                    const application = await applicationModel.findOne({
                        where : {
                            EmployeeID : ID
                        },
                        transaction : t
                    })

                    const acceptLog = {
                        CreatedAt : formatDate(new Date()),
                        Start : application.Start_Cuti,
                        End : application.End_Cuti,
                        Message : `Pengajuan ${application.Application_Type} disetujui`,
                        Type : "Accept"
                    }
                    await lService.createLog(ID, acceptLog, t)

                    logUpdates.push(acceptLog)

                    if(application.Application_Type == "Kompensasi"){
                        // Check if the date is before today
                        if(getDateObj(application.Start_Contract) <= new Date()){
                            await sService.updateStatus(ID, "Active", application.Start_Contract, application.End_Contract, t)
                            
                            const extendLog =  {
                                CreatedAt : formatDate(new Date()),
                                Start : application.Start_Contract,
                                End : application.End_Contract,
                                Message : `Lanjut Kontrak tanggal ${displayDate(getDateObj(application.Start_Contract))}`,
                                Type : "Contract"
                            }

                            await lService.createLog(ID, extendLog, t)

                            const currentStatus = {
                                Status : "Active",
                                Start : application.Start_Contract,
                                End : application.End_Contract,
                                message : "Status Changed to Active",
                            }
                            
                            logUpdates.push(extendLog)
                            await this.clearForm(ID, t)
                            return {
                                status : "Accepted",
                                currentStatus, 
                                logUpdates
                            }
                        }
                    }

                    
                    if(application.Application_Type == "Cuti"){
                        // Check if the date is before today
                        if(getDateObj(application.Start_Cuti) <= new Date()){
                            await sService.updateStatus(ID, application.Application_Type, application.Start_Cuti, application.End_Cuti, t)
                            
                            const leaveLog =  {
                                CreatedAt : formatDate(new Date()),
                                Start : application.Start_Cuti,
                                End : application.End_Cuti,
                                Message : `${application.Depart ? `Berangkat dari ${application.Depart} ke ${application.Arrival}` : 'Mulai Cuti'} tanggal ${displayDate(getDateObj(application.Start_Cuti))}`,
                                Type : "Cuti"
                            }

                            await lService.createLog(ID, leaveLog, t)

                            const currentStatus = {
                                Status : application.Application_Type,
                                Start : application.Start_Cuti,
                                End : application.End_Cuti,
                                message : "Status Changed to Cuti",
                            }
                            
                            logUpdates.push(leaveLog)
                            // Clear the application except Depart and Arrival
                            await applicationModel.update({
                                Application_Type : null,
                                Application_Status : null,
                                Start_Contract : null,
                                End_Contract : null,
                                Start_Cuti : null,
                                End_Cuti : null,
                                Resign_Date : null
                            },{
                                where :  {
                                    EmployeeID : ID
                                },
                                transaction : t
                            })

                            return {
                                status : "Accepted",
                                currentStatus, 
                                logUpdates
                            }
                        }
                    }

                    if(application.Application_Type == "Resign"){
                        if(getDateObj(application.Resign_Date) <= new Date()){
                            //update Status
                            await sService.updateStatus(ID, application.Application_Type, application.Resign_Date, t)
                            const resignLog = {
                                CreatedAt :  formatDate(new Date()),
                                Start : application.Resign_Date,
                                Message : `Resign tanggal ${displayDate(getDateObj(application.Resign_Date))}`,
                                Type : "Resign"
                            }

                            await lService.createLog(ID, resignLog, t)
                            logUpdates.push(resignLog)

                            const currentStatus = {
                                Status : application.Application_Type,
                                Start : application.Resign_Date,
                                message : "Status Changed to Resign"
                            }   
                         
                            await this.clearForm(ID, t)
                            return {
                                status : "Accepted",
                                currentStatus, 
                                logUpdates
                            }
                        }
                    }

                    return {
                        status : "Accepted",
                        message : "Application Accepted"
                    }
                }catch(error){
                    await t.rollback();
                    throw new Error(error)
                }
            })
            return updated
        } catch (error){
            throw error
        }
    }
    
    async clearForm(ID, t=null){
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
                },
                transaction : t
            })
            return cleared
        } catch(error){
            throw error
        }
    }

    // Reject application
    async reject(ID){
        try{
            const updated = sequelize.transaction(async (t)=>{
                try{
                    const rejected = await applicationModel.update({
                        Application_Status : "Rejected"
                    },{
                        where : {
                            [Op.and] : [
                                {EmployeeID : ID},
                                {Application_Status : "Pending"}
                            ]
                        },
                        transaction : t
                    })

                    // If there is no data updated
                    if(rejected[0] === 0) {
                        throw new Error("Application not Found") 
                    }

                    const application = await applicationModel.findOne({
                        where : {
                            EmployeeID : ID
                        },
                        transaction : t
                    })

                    const lService = new LogService()
        
                    await lService.createLog(ID,{
                        Start : application.Start_Cuti,
                        End : application.End_Cuti,
                        Message : `Pengajuan ${application.Application_Type} ditolak`,
                        Type : "Reject"
                    }, t)

                    return {
                        status : "Rejected",
                        message : "Application Rejected"
                    }

                }catch(error){
                    throw error
                }
            })
        
            return updated
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