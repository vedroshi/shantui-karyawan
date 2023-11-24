const logService = require('../services/logService')

class LogController {
    async createLog(req, res, next){
        const id = req.params.id
        const data = req.body
        const service = new logService()

        await service.createLog(id, data)
        .then((response)=>{
            if(response){
                res.status(200).json(response)
            }
        }).catch((error)=>{
            next(error)
        })
    }

    async showLogs(req, res, next){
        const id = req.params.id
        const service = new logService()

        await service.showLogs(id)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    async getLastContract(req, res, next){
        const id = req.params.id
        const service = new logService()

        await service.checkLastContract(id)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = LogController