const notificationService = require('../services/notificationService')

class notificationController{
    async addNotification(req, res, next){
        const service = new notificationService()
        const {Title, Description, Details} = req.body
        await service.addNotification(Title, Description, Details)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = notificationController