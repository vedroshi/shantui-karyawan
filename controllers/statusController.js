const statusService = require('../services/statusService')


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

    setWarning(req, res, next){
        const service = new statusService()
        service.setWarning()
        .then((response)=>{
            if(response){
                res.status(200).json({
                    message : "Status Set to Warning"
                })
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
}

module.exports = statusController