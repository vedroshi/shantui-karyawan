const applicationModel = require('../models/application.model')

const { Op } = require('sequelize')

const { getDateObj, displayDate, formatDate } = require('../utils/utils')
const { sequelize } = require('../utils/db_connect')

class ApplicationService {
    // Add application when Karyawan is Added
    async addApplication(ID, t) {
        try {
            const application = applicationModel.create({
                EmployeeID: ID,
                Apply_Date: new Date(),
                Application_Type: null,
                Application_Status: null,
                Start: null,
                End: null,
                Depart: null,
                Arrival: null
            }, { transaction: t })
            return application
        } catch (error) {
            throw new Error(error)
        }
    }

    async getApplication(ID, t = null) {
        try {
            const application = applicationModel.findOne({
                where: {
                    EmployeeID: ID
                },
                transaction: t
            })

            return application
        } catch (error) {
            throw new Error(error)
        }
    }

    // Apply application
    async apply(ID, form) {
        try {
            const LogService = require('./logService')

            const lservice = new LogService()

            
            const newApplication = sequelize.transaction(async (t) => {
                try {
                    const currentApplication = await this.getApplication(ID, t)

                    const logData = {
                        CreatedAt: formatDate(new Date()),
                        Start: null,
                        End: null,
                        Type: "Apply",
                    }

                    // Check if there is a changes in the Application form
                    const areFormsEqual = Object.keys(form).every(
                        (key) => currentApplication[key] === form[key]
                    );
                    if (areFormsEqual) {
                        throw new Error("Form Does not Change");
                    }


                    // Update the Form
                    const application = await applicationModel.update(form, {
                        where: {
                            EmployeeID: ID
                        },
                        transaction: t
                    })

                    // Set Up Log
                    switch (form.Application_Type) {
                        case "Kompensasi":
                            logData.Start = form.Start;
                            logData.End = form.End;
                            logData.Message = "Ajukan Kompensasi";
                            break;
                        case "Cuti":
                            logData.Start = form.Start;
                            logData.End = form.End;
                            logData.Message = `Ajukan Cuti dari Tanggal ${displayDate(logData.Start)} ${logData.End ? `Sampai ${displayDate(logData.End)}` : ""}`;
                            break;
                        case "Resign":
                            logData.Start = form.Start;
                            logData.Message = `Ajukan Resign tanggal ${displayDate(logData.Start)}`;
                            break;
                    }

                    // Edit Application Form
                    if (currentApplication.Application_Status == "Pending") {
                        var changedForm = [];

                        // Push the changed attribute
                        for (const attr of Object.keys(currentApplication.dataValues)) {
                            if (currentApplication.dataValues[attr] != form[attr]) {
                                changedForm.push(attr)
                            }
                        }

                        // Change Message According to changed attribute
                        if (changedForm.includes('Start')) {
                            logData.Message = `Ganti tanggal ${form.Application_Type} menjadi ${displayDate(form.Start)}`
                        }

                        if (changedForm.includes('End') && form.Application_Type == "Cuti") {
                            logData.Message = `Ganti Balik ${form.Application_Type} menjadi ${displayDate(form.End)}`
                            if (form.End_Cuti == null) {
                                logData.Message = `Balik ${form.Application_Type} tanggal ${displayDate(form.End)}`
                            }
                        }

                        if (changedForm.includes('Depart') || changedForm.includes('Arrival') && !changedForm.includes('Start')) {
                            logData.Message = `${form.Depart && form.Arrival ? `Ganti Destinasi dari ${form.Depart} ke ${form.Arrival}` : `Tidak Jadi Berangkat`}`
                        }

                        if (changedForm.includes('Application_Type')) {
                            logData.Message = `Ganti pengajuan dari ${currentApplication.dataValues.Application_Type} menjadi ${form.Application_Type}`
                        }

                        logData.Type = "Edit"
                    }

                    await lservice.createLog(ID, logData, t)

                    return { application, logData }
                } catch (error) {
                    throw error
                }
            })
            return newApplication
        } catch (error) {
            throw error
        }
    }

    async clearForm(ID, t = null) {
        try {
            const cleared = await applicationModel.update({
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
            return cleared
        } catch (error) {
            throw error
        }
    }

    // Approve application
    async approve(ID) {
        // Lazy Instatiation Services to avoid circular Dependencies
        const StatusService = require('./statusService')
        const karyawanService = require('./karyawanService')
        const LogService = require('./logService')
        const CalendarService = require('./calendarService')

        try {
            const updated = sequelize.transaction(async (t) => {
                try {

                    const sService = new StatusService()
                    const lService = new LogService()
                    const cService = new CalendarService()

                    const logUpdates = []

                    // Update Application Status in Database
                    const approved = await applicationModel.update({
                        Application_Status: "Accepted"
                    }, {
                        where: {
                            [Op.and]: [
                                { EmployeeID: ID },
                                { Application_Status: "Pending" }
                            ]
                        },
                        transaction: t
                    })

                    // If there is no data updated
                    if (approved[0] === 0) {
                        throw new Error("Application not Found")
                    }

                    // Find Application
                    const application = await this.getApplication(ID, t)

                    const acceptLog = {
                        CreatedAt: formatDate(new Date()),
                        Start: application.Start,
                        End: application.End,
                        Message: `Pengajuan ${application.Application_Type} disetujui`,
                        Type: "Accept"
                    }

                    // Add Log (Client and Server)
                    await lService.createLog(ID, acceptLog, t)
                    logUpdates.push(acceptLog)

                    // Get the name to set it on the agenda (calendar)
                    const kService = new karyawanService()
                    const karyawan = await kService.getKaryawan(ID, t)

                    // event Data to be added to Calendar
                    if (application.Application_Type == "Kompensasi") {

                        // Add Events to Calendar (For Start and End)
                        await cService.addEvent({
                            Title: karyawan.Name,
                            Start: application.Start,
                            Tags: "Extend",
                            Description: "Lanjut Kontrak",
                        }, t)
                        await cService.addEvent({
                            Title: karyawan.Name,
                            Start: application.End,
                            Tags: "Expired",
                            Description: "Jatuh Tempo",
                        }, t)

                        // Check if the date is before today
                        if (getDateObj(application.Start) <= new Date()) {
                            // Update status
                            // Extend Contract
                            await sService.extendContract(karyawan.ID, t)

                            const extendLog = {
                                CreatedAt: formatDate(new Date()),
                                Start: application.Start,
                                End: application.End,
                                Message: `Lanjut Kontrak tanggal ${displayDate(getDateObj(application.Start))}`,
                                Type: "Contract"
                            }

                            // Add Log (Server Log)
                            logUpdates.push(extendLog)


                            const currentStatus = {
                                Status: "Active",
                                Start: application.Start,
                                End: application.End,
                                message: "Status Changed to Active",
                            }

                            return {
                                status: "Accepted",
                                currentStatus,
                                logUpdates
                            }
                        }
                    }


                    if (application.Application_Type == "Cuti") {
                        // console.log(karyawan.Name)
                        await cService.addEvent({
                            Title: karyawan.Name,
                            Start: application.Start,
                            Tags: "Cuti",
                            Description: `Mulai Cuti ${application.Depart ? `dari ${application.Depart}` : ''} ${application.Arrival ? `ke ${application.Arrival}` : ''}`
                        }, t)

                        if (application.End) {
                            await cService.addEvent({
                                Title: karyawan.Name,
                                Start: application.End,
                                Tags: "Return",
                                Description: `Balik Cuti ${application.Arrival ? `dari ${application.Arrival}` : ''} ${application.Depart ? `ke ${application.Depart}` : ''}`
                            }, t)
                        }


                        // Check if the date is before today
                        if (getDateObj(application.Start) <= new Date()) {
                            await sService.setCuti(karyawan, application, t)

                            const leaveLog = {
                                CreatedAt: formatDate(new Date()),
                                Start: application.Start,
                                End: application.End,
                                Message: `${application.Depart ? `Berangkat Cuti dari ${application.Depart} ke ${application.Arrival}` : 'Mulai Cuti'} tanggal ${displayDate(getDateObj(application.Start))}`,
                                Type: "Cuti"
                            }

                            // Add Log (Server)
                            logUpdates.push(leaveLog)

                            const currentStatus = {
                                Status: application.Application_Type,
                                Start: application.Start,
                                End: application.End,
                                message: "Status Changed to Cuti",
                            }

                            return {
                                status: "Accepted",
                                currentStatus,
                                logUpdates
                            }
                        }
                    }


                    if (application.Application_Type == "Resign") {
                        // Add Event to Calendar
                        await cService.addEvent({
                            Title: karyawan.Name,
                            Start: application.Start,
                            Tags: application.Application_Type,
                            Description: "Resign"
                        }, t)

                        if (getDateObj(application.Start) <= new Date()) {
                            //update Status
                            await sService.updateStatus(ID, application.Application_Type, application.Start, null, t)
                            
                            const resignLog = {
                                CreatedAt: formatDate(new Date()),
                                Start: application.Start,
                                Message: `Resign tanggal ${displayDate(getDateObj(application.Start))}`,
                                Type: "Resign"
                            }

                            // Add Log (Server and Client)
                            await lService.createLog(ID, resignLog, t)
                            logUpdates.push(resignLog)

                            const currentStatus = {
                                Status: application.Application_Type,
                                Start: application.Start,
                                message: "Status Changed to Resign"
                            }

                            // Remove calendar events from resign date
                            
                            
                            await this.clearForm(ID, t)

                            return {
                                status: "Accepted",
                                currentStatus,
                                logUpdates
                            }
                        }
                    }

                    return {
                        status: "Accepted",
                        message: "Application Accepted",
                        logUpdates
                    }

                } catch (error) {
                    await t.rollback();
                    throw new Error(error)
                }
            })
            return updated
        } catch (error) {
            throw error
        }
    }

    // Reject application
    async reject(ID) {
        const StatusService = require('./statusService')
        const LogService = require('./logService')
        
        try {
            const updated = sequelize.transaction(async (t) => {
                try {

                    const logUpdates = []

                    // Update Application Status
                    const rejected = await applicationModel.update({
                        Application_Status: "Rejected"
                    }, {
                        where: {
                            [Op.and]: [
                                { EmployeeID: ID },
                                { Application_Status: "Pending" }
                            ]
                        },
                        transaction: t
                    })

                    // If there is no data updated
                    if (rejected[0] === 0) {
                        throw new Error("Application not Found")
                    }

                    // Find the Application Updated
                    const application = await this.getApplication(ID, t);
                    
                    // Push Log (Client & Server)
                    const lService = new LogService()

                    await lService.createLog(ID, {
                        Start: application.Start,
                        End: application.End,
                        Message: `Pengajuan ${application.Application_Type} ditolak`,
                        Type: "Reject"
                    }, t)

                    // Cut Off
                    if (getDateObj(application.Start) <= new Date()){
                        const sService = new StatusService()
                        await sService.cutOff(ID, application.Start, t)
                        
                        const currentStatus = {
                            Status: "Cut Off",
                            Start: application.Start,
                            End: null,
                            message: "Status Changed to Cut Off",
                        }

                        const cutOffLog = {
                            CreatedAt: formatDate(new Date()),
                            Start: application.Start,
                            Message: `Cut Off tanggal ${displayDate(getDateObj(application.Start))}`,
                            Type: "Cut Off"
                        }

                        logUpdates.push(cutOffLog)

                        return{
                            status : "Rejected",
                            currentStatus,
                            logUpdates
                        }
                    }

                    return {
                        status: "Rejected",
                        message: "Application Rejected",
                    }

                } catch (error) {
                    await t.rollback();
                    throw error
                }
            })

            return updated
        } catch (error) {
            throw error
        }
    }

    // Set Return Status
    async setReturn(ID, data) {
        try {
            const application = await applicationModel.update(data, {
                where: {
                    EmployeeID: ID
                }
            })

            if (application) {
                return application
            }
        } catch (error) {
            throw new Error(error)
        }
    }

}

module.exports = ApplicationService