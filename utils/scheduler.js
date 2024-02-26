const schedule = require('node-schedule')
const statusService = require('../services/statusService')
const notificationService = require('../services/notificationService')
const karyawanService = require('../services/karyawanService')

const logger = require('../utils/logger')


// Execute Everyday at 00:00, 09:00 and 17:00 
schedule.scheduleJob('0 0,10,17 * * *' , async ()=>{
    const statService = new statusService()
    const notifService = new notificationService()
    const employeeService = new karyawanService()
    
    try{
        // Call Check Expired and Check End Cuti in StatusService
        const [applicationLog, warningLog, expiredLog, returnLog] = await Promise.all([
            // Check if there is an employee has their leave in advance
            employeeService.checkApplication(),
            // Check if there is an employee has their contract end in 7 days
            statService.setWarning(),
            // Check if there is an employee has their contract ends
            statService.checkExpired(),
            // Check if there is an employee return 
            statService.checkEndCuti(),
        ])
    
    
        // Define logs to keep track which employee is updated
        const allLogs = [...applicationLog,...warningLog, ...expiredLog, ...returnLog]
        
        // get unique items from all logs
        const logs = [...new Set(allLogs)]
        console.log(logs)

        // Add Notification
        const warningEmployeeID = warningLog.map(log => log.ID)
        const expiredEmployeeID = expiredLog.map(log => log.ID)
        const returnEmployeeID = returnLog.map(log => log.ID)
        
        const [warningKaryawan, expiredKaryawan, returnKaryawan] = await Promise.all([
           warningEmployeeID.length ? employeeService.getKaryawanList(warningEmployeeID) : null,
           warningEmployeeID.length ? employeeService.getKaryawanList(expiredEmployeeID) : null,
           warningEmployeeID.length ? employeeService.getKaryawanList(returnEmployeeID) : null,
        ])
        

        const addNotifications = async (karyawanList, message) =>{
            if (karyawanList){
                for (const karyawan of karyawanList){
                    notifService.addNotification(karyawan.Name, message)
                }
            }
        }

        // Add Notification
        await Promise.all([
            addNotifications(warningKaryawan, "Sudah mau jatuh tempo"),
            addNotifications(expiredKaryawan, "Sudah jatuh tempo"),
            addNotifications(returnKaryawan, "Balik Cuti")
        ])

        logger.info("Status Updated")

        // Update Calendar

    }catch(err){
        console.error('Error in checkExpired job:', err);
    }
})
