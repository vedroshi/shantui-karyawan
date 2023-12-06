const schedule = require('node-schedule')
const statusService = require('../services/statusService')


// Execute Every 00:00, 09:00 and 17:00 Everyday
schedule.scheduleJob('0 0,9,17 * * *' , async ()=>{
    const service = new statusService()
    
    try{
        // Call Check Expired and Check End Cuti in StatusService
        await service.setWarning()
        const expiredLog = await service.checkExpired()
        const returnLog = await service.checkEndCuti()
    
        const logs = [...expiredLog, ...returnLog]

    
        console.log(logs)
    }catch(err){
        console.error('Error in checkExpired job:', err);
    }
})
