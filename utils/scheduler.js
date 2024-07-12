const schedule = require('node-schedule')
const statusService = require('../services/statusService')
const notificationService = require('../services/notificationService')
const karyawanService = require('../services/karyawanService')

const logger = require('../utils/logger')

// Execute Everyday at 00:00, 09:00, and 17:00 
schedule.scheduleJob('0 0,9,17 * * *' , async ()=>{
    const statService = new statusService()
    const notifService = new notificationService()
    const employeeService = new karyawanService()
    
    try{
        // Call Check Expired and Check End Cuti in StatusService
        const [applicationLog, warningLog, expiredLog, returnLog] = await Promise.all([
            // Check if there is an employee has their contract end in 7 days
            statService.setWarning(),
            // Check if there is an employee has their contract ends
            statService.checkExpired(),
            // Check if there is an employee has their leave in advance
            employeeService.checkApplication(),
            // Check if there is an employee return 
            statService.checkEndCuti(),
        ])
    
    
        // Define logs to keep track which employee is updated
        const allLogs = [...applicationLog, ...warningLog, ...expiredLog, ...returnLog]
        
        // get unique items from all logs
        const logs = [...new Set(allLogs)]
        console.log(logs)

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

        // Add Notification
        await Promise.all([
            // addNotifications(warningKaryawan, "Sudah mau jatuh tempo"),
            // addNotifications(expiredKaryawan, "Sudah jatuh tempo"),
            // addNotifications(returnKaryawan, "Balik Cuti")

            addNotifications(logs)
        ])

        logger.info("Status Updated")


    }catch(err){
        console.error('Error in checkExpired job:', err);
    }
})
