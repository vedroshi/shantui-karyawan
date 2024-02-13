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

    async getNotifications(req, res, next){
        const service = new notificationService()
        await service.getNotifications()
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    async readNotification(req, res, next){
        const id = req.params.id
        const service = new notificationService()

        await service.readNotification(id)
        .then((response)=>{
            res.status(200).json({
                Message : "Notification Read"
            })
        }).catch((error)=>{
            next(error)
        })
    }

    async readAllNotification(req, res, next){
        const service = new notificationService()

        await service.readAllNotification()
        .then((response)=>{
            res.status(200).json({
                Status : "Success",
                Message : "All Notification Read"
            })
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = notificationController