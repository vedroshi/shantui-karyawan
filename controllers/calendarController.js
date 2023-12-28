const calendarService = require('../services/calendarService')

class calendarController {
    addEvent(req, res, next){
        const data = req.body
        const service = new calendarService()

        service.addEvent(data)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    getEvents(req, res, next){
        const service = new calendarService()
        const start = req.query.start
        const end = req.query.end
        
        service.getEvents(start, end)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = calendarController