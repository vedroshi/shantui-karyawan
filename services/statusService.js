const statusModel = require('../models/status.model')
const applicationModel = require('../models/application.model')
const karyawanModel = require('../models/karyawan.model')

const { getDateObj, formatDate, displayDate } = require('../utils/utils')
const { sequelize } = require('../utils/db_connect')
const { Op } = require('sequelize')

const LogService = require('./logService')
const CalendarService = require('./calendarService')
const ContractService = require('./contractService')


class StatusService {

    async addStatus(karyawan, t) {
        try {

            const newStatus = await statusModel.create({
                EmployeeID: karyawan.ID,
                Status: "Active",
                Start: karyawan.Join_Date,
                End: getDateObj(karyawan.Join_Date).setMonth(getDateObj(karyawan.Join_Date).getMonth() + 6)
            }, { transaction: t })

            return newStatus
        } catch (error) {
            throw new Error(error)
        }
    }

    async showStatus(ID) {
        try {
            const status = await statusModel.findOne({
                where: {
                    EmployeeID: ID
                }
            })
            return status
        } catch (error) {
            throw new Error(error)
        }
    }

    async updateStatus(ID, status, start = null, end = null, t = null) {
        try {
            const changes = await statusModel.update({
                Status: status,
                Start: start,
                End: end
            }, {
                where: {
                    EmployeeID: ID
                },
                transaction: t
            })
            return changes
        } catch (error) {
            throw new Error(error)
        }
    }

    async setWarning() {
        try {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            const transaction = await sequelize.transaction(async (t) => {
                try {
                    let warningLog = [];

                    const karyawan = await statusModel.findAll({
                        attributes: ['EmployeeID'],
                        where: {
                            Status: 'Active',
                            End: {
                                [Op.between]: [new Date(), dueDate]
                            }
                        },
                        transaction: t
                    })

                    // If there is no karyawan found stop the transaction and return 0
                    if (karyawan.length == 0) {
                        return []
                    }

                    // Update Status = 'Warning' when End Contract is between today and next 7 days
                    await statusModel.update(
                        {
                            Status: 'Warning'
                        }, {
                        where: {
                            Status: 'Active',
                            End: {
                                [Op.between]: [new Date(), dueDate]
                            }
                        },
                        transaction: t,
                    })


                    for (const employee of karyawan) {
                        warningLog.push({
                            ID: employee.EmployeeID,
                            message: "Set to Warning"
                        })
                    }

                    return warningLog

                } catch (error) {
                    t.rollback()
                    throw new Error(error)
                }
            })

            return transaction
        } catch (error) {
            throw error
        }
    }

    async checkExpired() {
        try {
            const updated = sequelize.transaction(async (t) => {
                const updateLog = []
                try {
                    // Find all Employee that Expired (Status.End <= Today)
                    const karyawan = await karyawanModel.findAll({
                        attributes: ['ID'],
                        include: [{
                            model: applicationModel,
                            as: 'Application',
                        }, {
                            model: statusModel,
                            as: 'Status',
                            where: {
                                End: {
                                    [Op.lte]: new Date()
                                },
                                Status: {
                                    [Op.or]: ["Active", "Warning", "Close Project"]
                                }
                            }
                        }],
                        transaction: t
                    })

                    // Check if there is an employee who applied a form
                    if (karyawan) {
                        for (const employee of karyawan) {
                            const application = employee.Application
                            const status = employee.Status

                            // Skip employee with Expired Contract without any application form 
                            if (status.Status === "Close Project" && !application.Application_Status) {
                                continue
                            }

                            if (application.Application_Status === "Rejected" ) {
                                await this.cutOff(employee.ID, new Date(), t)
                                updateLog.push({
                                    ID: employee.ID,
                                    message: `Employee Cut Off`,
                                    type: 'Cut Off'
                                })
                            } else if (application.Application_Status === "Pending") {
                                if(status.Status != "Close Project"){
                                    await this.setCloseProject(employee.ID, status.Start, status.End, t)
                                    // Add Server Log
                                    updateLog.push({
                                        ID: employee.ID,
                                        message: `Contract has Expired`,
                                        type: 'Expired'
                                    })
                                }
                                continue
                            } else if (application.Application_Status === "Accepted") {
                                if (application.Application_Type === "Kompensasi") {
                                    await this.extendContract(employee.ID, t)
                                } else if (application.Application_Type === "Cuti" && getDateObj(application.Start) <= new Date()) {
                                    await this.setCuti(employee, application, t);
                                    updateLog.push({
                                        ID: employee.ID,
                                        message: "This Employee takes a Leave",
                                        type: "Cuti"
                                    });
                                } else if (application.Application_Type === "Resign" && getDateObj(application.Start) <= new Date()) {
                                    await this.resign(ID, application.Start, t);
                                    updateLog.push({
                                        ID: employee.ID,
                                        message: `Employee Resign`,
                                        type: "Resign"
                                    });
                                }else{
                                    if(status.Status != "Close Project"){
                                        await this.setCloseProject(employee.ID, status.Start, status.End, t);
                                        updateLog.push({
                                            ID: employee.ID,
                                            message: `Contract has Expired`,
                                            type: 'Expired'
                                        })
                                    }
                                    continue
                                }
                            }else {
                                await this.setCloseProject(employee.ID, status.Start, status.End, t);
                                updateLog.push({
                                    ID: employee.ID,
                                    message: `Contract has Expired`,
                                    type: 'Expired'
                                });
                            }
                            
                        }
                    }
                    return updateLog

                } catch (error) {
                    console.log(error)
                    await t.rollback()
                    throw error
                }
            })

            return updated
        } catch (error) {
            throw error
        }
    }

    async checkEndCuti() {
        try {
            const transaction = sequelize.transaction(async (t) => {
                const logService = new LogService()
                const contractService = new ContractService()
                const updateLog = []
                try {
                    // Find All Employee with today as the end of "Cuti"
                    const karyawan = await statusModel.findAll({
                        where: {
                            Status: "Cuti",
                            End: {
                                [Op.lte]: new Date(),
                            }
                        },
                        transaction: t
                    })

                    for (const employee of karyawan) {
                        const contract = await logService.checkLastContract(employee.EmployeeID, t)

                        // If the employee is leaving site during "Cuti"
                        const ticket = await applicationModel.findOne({
                            attributes: ["Depart", "Arrival"],
                            where: {
                                EmployeeID: employee.EmployeeID
                            },
                            limit: 1,
                            transaction: t
                        })


                        // Checking if the last contract is already expired or not
                        if (getDateObj(contract.End) <= new Date()) {
                            // Assign Date for New Contract
                            const start_contract = getDateObj(employee.End)
                            const end_contract = new Date(start_contract)
                            end_contract.setMonth(end_contract.getMonth() + 6)

                            // Create new Contract
                            await this.updateStatus(employee.EmployeeID, "Active", formatDate(start_contract), formatDate(end_contract), t)

                            // await contractService.addContract(employee.EmployeeID, formatDate(start_contract), formatDate(end_contract), t)

                            await logService.createLog(employee.EmployeeID, {
                                CreatedAt: formatDate(new Date()),
                                Start: formatDate(start_contract),
                                End: formatDate(end_contract),
                                Message: `Balik dari ${ticket.Depart ? `${ticket.Arrival} ke ${ticket.Depart}` : 'Cuti'} dan Buat Kontrak baru`,
                                Type: 'Contract'
                            }, t)

                        } else {
                            await this.updateStatus(employee.EmployeeID, "Active", formatDate(contract.Start), formatDate(contract.End), t)
                            await logService.createLog(employee.EmployeeID, {
                                CreatedAt: formatDate(new Date()),
                                Start: formatDate(contract.Start),
                                End: formatDate(contract.End),
                                Message: `Balik dari ${ticket.Depart ? `${ticket.Arrival} ke ${ticket.Depart}` : 'Cuti'}`,
                                Type: 'Return'
                            }, t)
                        }

                        // Update Log to show which employee is Return
                        updateLog.push({
                            ID: employee.EmployeeID,
                            message: "Balik Cuti",
                            type: 'Return'
                        })
                    }
                    return updateLog
                } catch (error) {
                    throw error
                }
            })
            return transaction
        } catch (error) {
            throw error
        }
    }

    async extendContract(ID, t = null) {
        const logService = new LogService()
        const contractService = new ContractService()

        const latestContract = await logService.checkLastContract(ID, t)

        // New Start Date
        const newContractStart = new Date(latestContract.End)
        newContractStart.setDate(newContractStart.getDate() + 1)

        // New End Date
        const newContractEnd = new Date(newContractStart)
        newContractEnd.setMonth(newContractEnd.getMonth() + 6)

        // Convert Date into String
        const start = formatDate(newContractStart)
        const end = formatDate(newContractEnd)

        // Update Status
        this.updateStatus(ID, "Active", start, end, t = t)

        // Create New Contract
        // await contractService.addContract(ID, start, end, t = t)

        // Create Log (Client)
        await logService.createLog(ID, {
            CreatedAt: formatDate(new Date()),
            Start: start,
            End: end,
            Type: "Contract",
            Message: `Lanjut Kontrak`
        }, t)

        // Clear Application
        await applicationModel.update({
            Application_Type: null,
            Application_Status: null,
            Start: null,
            End: null,
            Depart: null,
            Arrival: null,
        }, {
            where: {
                EmployeeID: ID
            },
            transaction: t
        })
    }

    async setCloseProject(ID, start = null, end = null, t = null) {
        const logService = new LogService()
        this.updateStatus(ID, "Close Project", start, end, t = t)

        await logService.createLog(ID, {
            CreatedAt: formatDate(new Date()),
            Message: `Masa Kontrak Jatuh Tempo`
        }, t)
    }

    async setCuti(employee, application, t = null) {
        const logService = new LogService()
        await this.updateStatus(employee.ID, "Cuti", application.Start, application.End, t)

        // Removing all from the application except "Depart" and "Arrival"
        await applicationModel.update({
            Application_Type: null,
            Application_Status: null,
            Start: null,
            End: null,
        }, {
            where: {
                EmployeeID: employee.ID
            },
            transaction: t
        })

        await logService.createLog(employee.ID, {
            Start: application.Start,
            Type: "Cuti",
            Message: `${application.Depart ? `Berangkat Cuti dari ${application.Depart} ke ${application.Arrival}` : 'Mulai Cuti'} tanggal ${displayDate(getDateObj(application.Start))}`,
        }, t)
    }

    async setEndCuti(ID, data) {
        try {
            const calendarService = new CalendarService()
            const transaction = await sequelize.transaction(async (t) => {
                try {

                    // check if there is a agenda in the calendar
                    const karyawan = await karyawanModel.findOne({
                        attributes: ['Name'],
                        include: [{
                            model: statusModel,
                            as: "Status",
                            attributes: ['Start', 'End']
                        }],
                        where: {
                            ID: ID
                        },
                        transaction: t
                    })

                    const agendaData = {
                        Title: karyawan.Name,
                        Start: karyawan.Status.End,
                        Tags: "Return",
                        Description: "Balik Cuti"
                    }

                    const agenda = await calendarService.findEvent(agendaData, t)

                    // Update the date
                    agendaData.Start = data.Date

                    if (agenda) {
                        await calendarService.updateEvent(agenda.ID, agendaData, t)
                    } else {
                        await calendarService.addEvent(agendaData, t)
                    }

                    const changes = await statusModel.update({
                        End: data.Date,
                    }, {
                        where: {
                            EmployeeID: ID,
                            Status: 'Cuti'
                        },
                        transaction: t
                    })

                    return changes
                } catch (error) {
                    throw error
                }
            })
            return transaction
        } catch (error) {
            throw error
        }
    }

    async resign(ID, date, t = null) {
        const logService = new LogService()
        const calendarService = new CalendarService()

        const karyawan = await karyawanModel.findOne({
            attributes : ['Name'],
            where : {
                ID : ID
            },
            transaction : t
        })

        await this.updateStatus(ID, "Resign", date, null, t = t)

        // Remove Calendar Events
        await calendarService.deleteEvents(karyawan.Name, date, t)

        await logService.createLog(ID, {
            Start: date,
            Type: "Resign",
            Message: `Resign Tanggal ${displayDate(getDateObj(date))}`
        }, t)
    }

    async cutOff(ID, date, t = null) {
        try {
            const logService = new LogService()
            const calendarService = new CalendarService()

            const karyawan = await karyawanModel.findOne({
                attributes : ['Name'],
                where : {
                    ID : ID
                },
                transaction : t
            })

            const changes = await this.updateStatus(ID, "Cut Off", date, null, t = t)

            // Add Log
            await logService.createLog(ID, {
                Start: formatDate(date),
                Type: "Cut Off",
                Message: `Cut Off tanggal ${displayDate(date)}`
            }, t)

            // Add Events to Calendar
            await calendarService.addEvent({
                Title: karyawan.Name,
                Start: formatDate(date),
                Tags: 'Cut Off',
                Description: "Cut Off"
            }, t)


            // Emptying the Application
            await applicationModel.update({
                Application_Type: null,
                Application_Status: null,
                Start: null,
                End: null,
                Arrival: null,
                Depart: null,
            }, {
                where: {
                    EmployeeID: ID
                },
                transaction: t
            })

            
            // Remove Calendar Events
            await calendarService.deleteEvents(karyawan.Name, date, t)

            return changes

        } catch (error) {
            throw error
        }
    }

    async updateContractNumber(ID, contractNumber, t=null){
        try{
            await statusModel.update({
                Contract_Number : contractNumber
            }, {
                where : {
                    EmployeeID : ID,
                    Contract_Number : {
                        [Op.ne] : contractNumber
                    }
                },
                transaction : t
            })
        }catch(error){
            throw error
        }
    }

}

module.exports = StatusService