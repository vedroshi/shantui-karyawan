const statusModel = require('../models/status.model')
const applicationModel = require('../models/application.model')
const karyawanModel = require('../models/karyawan.model')

const {getDateObj, formatDate, displayDate, revertDate} = require('../utils/utils')
const { Op } = require('sequelize')

const {sequelize} = require('../utils/db_connect')
const LogService = require('./logService')

class StatusService {

    async addStatus(karyawan, t){
        try{
     
            const newStatus = await statusModel.create({
                EmployeeID : karyawan.ID,
                Status : "Active",
                Start : karyawan.Join_Date,
                End : getDateObj(karyawan.Join_Date).setMonth(getDateObj(karyawan.Join_Date).getMonth() + 6)
            }, {transaction : t})
            
            return newStatus
        }catch(error){
            throw new Error(error)
        }
    }

    async showStatus(ID){
        try{
            const status = await statusModel.findOne({
                where : {
                    EmployeeID : ID
                }
            })
            return status
        }catch(error){
            throw new Error(error)
        }
    }

    async updateStatus(ID, status, start=null, end=null, t=null){
        try{
            const changes = await statusModel.update({
                Status : status,
                Start : start,
                End : end
            }, {
                where :{
                    EmployeeID : ID
                },
                transaction : t
            })
            return changes
        }catch(error){
            throw new Error(error)
        }
    }

    async setWarning(){
        try{
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            // Update Status = 'Warning' when End Contract is between today and next 7 days
            const status = statusModel.update(
                {
                    Status : 'Warning'
                },{
                where : {
                    Status : 'Active',
                    End : { 
                        [Op.between] : [new Date(), dueDate]
                    }
                }
            })

            return status
        }catch(error){
          throw new Error(error)
        }
    }

    async checkExpired(){
        try{
            const updated = sequelize.transaction(async (t)=>{
                const updateLog = []
                try{
                    // Find all Employee that Expired (Status.End == Today)
                    const karyawan = await karyawanModel.findAll({
                        attributes : ['ID'],
                        include : [{
                            model : applicationModel,
                            as : 'Application',
                        }, {
                            model : statusModel,
                            as : 'Status',
                            where : {
                                End : {
                                    [Op.lte] : new Date()
                                },
                                Status : {
                                    [Op.or] : ["Active", "Warning", "Close Project"]
                                }
                            }
                        }],
                        transaction : t
                    })

                    if(karyawan){
                        for (const employee of karyawan){
                            if(employee.Application.Application_Type == "Kompensasi" && employee.Application.Application_Status == "Accepted"){
                                // Extend Contract
                                await this.extendContract(employee, t)
                                updateLog.push({
                                    ID : employee.ID,
                                    message : "Contract has been Extended"
                                })
                            }else if (employee.Application.Application_Type == "Cuti" && employee.Application.Application_Status == "Accepted"){
                                // If the Start Cuti Date is later than today
                                if(getDateObj(employee.Application.Start_Cuti) <= new Date()){
                                    await this.setCuti(employee, t)
                                    updateLog.push({
                                        ID : employee.ID,
                                        message : "This Employee takes a Leave"
                                    })
                                }else{
                                    // Set Active from Today to Start_Cuti
                                    await this.updateStatus(employee.ID, "Active", new Date(), employee.Application.Start_Cuti, t)

                                    updateLog.push({
                                        ID : employee.ID,
                                        message : `Postpone Leave on ${displayDate(getDateObj(employee.Application.Start_Cuti))}`
                                    })
                                }
                            }else if (employee.Application.Application_Type == "Resign" && employee.Application.Application_Status == "Accepted"){
                                // If the resign date is sooner than today
                                if(getDateObj(employee.Application.Resign_Date) <= new Date()){
                                    await this.resign(employee, t)
                                    updateLog.push({
                                        ID : employee.ID,
                                        message : `Employee Resign`
                                    })
                                }else{
                                    await this.updateStatus(employee.ID, "Active", new Date(), employee.Application.Resign_Date, t)
                                }
                            }else if(employee.Application.Application_Status == "Rejected"){
                                await this.cutOff(employee.ID, new Date(), t)
                                updateLog.push({
                                    ID : employee.ID,
                                    message : `Employee Cut Off`
                                })
                            }else if (employee.Application.Application_Status == "Pending"){
                                if(employee.Application.Application_Type == "Cuti"){
                                    await this.setCloseProject(employee.ID, new Date(), employee.Application.Start_Cuti, t)
                                }

                                if(employee.Application.Application_Type == "Kompensasi"){
                                    await this.setCloseProject(employee.ID, new Date(), employee.Application.Start_Contract, t)
                                }
                                
                                updateLog.push({
                                    ID: employee.ID,
                                    message : `Contract has Expired`
                                })
                            }else{
                                await this.setCloseProject(employee.ID, employee.Status.Start, employee.Status.End, t=t)
                                updateLog.push({
                                    ID : employee.ID,
                                    message : `Contract has Expired`
                                })
                            }
                        }
                    }
                    return updateLog
                } catch(error) {
                    console.log(error)
                    await t.rollback()
                    throw error
                }
            })
           
            return updated
        }catch(error){
            throw error
        }
    }

    async checkEndCuti(){
        try{
            const transaction = sequelize.transaction(async(t)=>{
                const logService = new LogService()
                const updateLog = []
                try{
                    // Find All Employee with today as the end of "Cuti"
                    const karyawan = await statusModel.findAll({
                        where : {
                            Status : "Cuti",
                            End : new Date()
                        },
                        transaction : t
                    })
                    
                    for (const employee of karyawan){
                        const contract = await logService.checkLastContract(employee.EmployeeID, t)

                        // If the employee is leaving site during "Cuti"
                        const ticket = await applicationModel.findOne({
                            attributes : ["Depart", "Arrival"],
                            where : {
                                EmployeeID : employee.EmployeeID
                            },
                            limit : 1,
                            transaction : t
                        })

                        

                        // Checking if the last contract is already expired or not
                        if(getDateObj(contract.End) <= new Date()){
                            // Assign Date for New Contract
                            const start_contract = getDateObj(employee.End)
                            const end_contract = new Date(start_contract)
                            end_contract.setMonth(end_contract.getMonth() + 6)
                           
                            // Create new Contract
                            await this.updateStatus(employee.EmployeeID, "Active", formatDate(start_contract), formatDate(end_contract), t)

                            await logService.createLog(employee.EmployeeID,{
                                CreatedAt : formatDate(new Date()),
                                Start : formatDate(start_contract),
                                End : formatDate(end_contract),
                                Message : `Balik dari ${ticket.Depart ? `${ticket.Arrival} ke ${ticket.Depart}` : 'Cuti'} dan Buat Kontrak baru`,
                                Type : 'Contract'
                            }, t)

                        }else{
                            await this.updateStatus(employee.EmployeeID, "Active", formatDate(contract.Start), formatDate(contract.End), t)    
                            await logService.createLog(employee.EmployeeID,{
                                CreatedAt : formatDate(new Date()),
                                Start : formatDate(contract.Start),
                                End : formatDate(contract.End),
                                Message : `Balik dari ${ticket.Depart ? `${ticket.Arrival} ke ${ticket.Depart}` : 'Cuti' }`,
                                Type : 'Return'
                            }, t)
                        }

                        // Update Log to show which employee is Return
                        updateLog.push({
                            ID : employee.EmployeeID,
                            Message : "Balik Cuti"
                        })
                    }
                    return updateLog
                }catch(error){
                    throw error
                }
            })
            return transaction
        } catch(error){
            throw error
        }
    }

    async extendContract(employee, t=null){
        const logService = new LogService()

        this.updateStatus(employee.ID, "Active", employee.Application.Start_Contract,  employee.Application.End_Contract, t=t)
        
        await logService.createLog(employee.ID, {
            CreatedAt : formatDate(new Date()),
            Start : employee.Application.Start_Contract,
            End : employee.Application.End_Contract,
            Type : "Contract",
            Message : `Lanjut Kontrak`
        }, t)

        await applicationModel.update({
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
                EmployeeID : employee.ID
            },
            transaction : t
        })
    }

    async setCloseProject(ID, start=null, end=null, t=null){
        const logService = new LogService()
        this.updateStatus(ID, "Close Project", start, end, t=t)

        await logService.createLog(ID, {
            CreatedAt : formatDate(new Date()),
            Message : `Masa Kontrak Jatuh Tempo`
        }, t)
    }

    async setCuti(employee, t=null){
        const logService = new LogService()
        await this.updateStatus(employee.ID, "Cuti", employee.Application.Start_Cuti, employee.Application.End_Cuti, t)

        // Removing all from the application except "Depart" and "Arrival"
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

        await logService.createLog(employee.ID, {
            Start : employee.Application.Start_Cuti,
            Type : "Cuti",
            Message : `${employee.Application.Depart ? `Berangkat dari ${employee.Application.Depart} ke ${employee.Application.Arrival}` : 'Mulai Cuti'} tanggal ${displayDate(getDateObj(employee.Application.Start_Cuti))}`,
        }, t)
    }

    async setEndCuti(ID, data){
    try{
        const changes = await statusModel.update({
            End : data.Date,
        },{
            where : {
                EmployeeID : ID,
                Status : 'Cuti'
            }
        })
            return changes
        } catch(error){
            throw new Error(error)
        }
    }

    async resign(employee, t=null){
        const logService = new LogService()

        await this.updateStatus(employee.ID, "Resign", employee.Application.Resign_Date, null, t=t)
        
        await logService.createLog(employee.ID, {
            Start : employee.Application.Start_Cuti,
            Type : "Resign",
            Message : `Resign Tanggal ${displayDate(getDateObj(employee.Application.Start_Cuti))}`
        }, t)
    }

    async cutOff(ID, date, t=null){
        try{
            const logService = new LogService()
            
            const changes = await this.updateStatus(ID, "Cut Off", date, null, t=t)
            
            await logService.createLog(ID, {
                Start : formatDate(date),
                Type : "Cut Off",
                Message : `Cut Off tanggal ${displayDate(date)}`
            }, t)

            // Emptying the Application
            await applicationModel.update({
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

            return changes
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = StatusService