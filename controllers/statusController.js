const statusService = require('../services/statusService')
const karyawanService = require('../services/karyawanService')
const notificationService = require('../services/notificationService')
const { response } = require('express')



class statusController {

    setEndCuti(req, res, next){
        const data = req.body
        const id = req.params.id
        const services = new statusService()

        services.setEndCuti(id, data)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    end : data.Date,
                    message : "End Cuti is Set"
                })
            }
        }).catch((error)=>{
            next(error)
        })

    }

    setCutOff(req, res, next){
        const data = req.body
        const id = req.params.id

        const service = new statusService()

        service.cutOff(id, data.Date)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    start : data.Date,
                    message : "Employee is Cut Off"
                })
            }
        }).catch((error)=>{
            next(error)
        })
    
    }
    
    setResign(req, res, next){
        const id = req.params.id;
        const data = req.body;

        const service = new statusService()
        
        service.resign(id, data.Date)
        .then((response) => {
            res.status(200).json({
                start : data.Date,
                message : "Employee Resign"
            })
        }).catch((err)=>{
            next(err)
        })

    }

    setWarning(req, res, next){
        const service = new statusService()
        service.setWarning()
        .then((response)=>{
            if(response){
                res.status(200).json(response)
            }
        }).catch((error)=>{
            next(error)
        })
    }

    checkExpired(req, res, next){
        const service=  new statusService()
        service.checkExpired()
        .then((response)=>{
            if(response){
                res.status(200).json(response)
            }
        }).catch((error)=>{
            next(error)
        })
    }

    checkEndCuti(req, res, next){
        const service = new statusService()

        service.checkEndCuti()
        .then((response)=>{
            if (response){
                res.status(200).json(response)
            } 
        }).catch((error)=>{
            next(error)
        })
    }
    
    
    async checkDue(req, res, next){
        const service = new statusService()
        const employeeService = new karyawanService()
        const notifService = new notificationService()

        try{      
             // Call Check Expired and Check End Cuti in StatusService
        const [applicationLog, warningLog, expiredLog, returnLog] = await Promise.all([
            // Check if there is an employee have an early leave
            employeeService.checkApplication(),
            // Check if there is an employee has their contract end in 7 days
            service.setWarning(),
            // Check if there is an employee has their contract ends
            service.checkExpired(),
            // Check if there is an employee return 
            service.checkEndCuti(),
        ])
    
    
         // Define logs to keep track which employee is updated
         const allLogs = [...applicationLog, ...warningLog, ...expiredLog, ...returnLog]
        
         // get unique items from all logs
         const logs = [...new Set(allLogs)]
         console.log(logs)

        // const logID = logs.map(log => log.ID)

        // Add Notification
        // const warningEmployeeID = warningLog.map(log => log.ID)
        // const expiredEmployeeID = expiredLog.map(log => log.ID)
        // const returnEmployeeID = returnLog.map(log => log.ID)
        

        // const [warningKaryawan, expiredKaryawan, returnKaryawan] = await Promise.all([
        //    warningEmployeeID.length ? employeeService.getKaryawanList(warningEmployeeID) : null,
        //    warningEmployeeID.length ? employeeService.getKaryawanList(expiredEmployeeID) : null,
        //    warningEmployeeID.length ? employeeService.getKaryawanList(returnEmployeeID) : null,
        // ])
     
        const addNotifications = async (karyawanList) =>{
            let message = ""
            if (karyawanList){
                for (const karyawan of karyawanList){
                    if(karyawan.type == "Warning"){
                        message = "Sudah Mau Jatuh Tempo"
                    }else if(karyawan.type == "Expired"){
                        message = "Sudah Jatuh Tempo"
                    }else if(karyawan.type == "Cuti"){
                        message = "Mulai Cuti"
                    }else if(karyawan.type == "Cut Off"){
                        message = "Cut Off"
                    }else if(karyawan.type == "Resign"){
                        message = "Resign"
                    }else if(karyawan.type == "Return"){
                        message = "Balik Cuti"
                    }

                    // Get Employee Name Based on ID in logs
                    const employee = await employeeService.getKaryawanList(karyawan.ID)
                    const name = employee.Name

                    // Add Notification
                    await notifService.addNotification(name, message)
                }
            }
        }

        await Promise.all([
        //     addNotifications(warningKaryawan, "Sudah mau jatuh tempo"),
        //     addNotifications(expiredKaryawan, "Sudah jatuh tempo"),
        //     addNotifications(returnKaryawan, "Balik Cuti")
            addNotifications(logs)
        ])

            res.status(200).json(logs)
        }catch(error){
            next(error)
        }

    }
}

module.exports = statusController