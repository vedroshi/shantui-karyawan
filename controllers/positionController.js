const PositionService = require('../services/positionService')

class PositionController{
    async createPosition(req, res, next){
        const positionData = req.body
        const positionService = new PositionService()

        await positionService.upsertPosition(positionData).then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    async showPositions(req, res, next){
        const service = new PositionService()
        await service.showPositions()
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = PositionController