const notificationModel = require('../models/notification.model')

class notificationService{
    async addNotification(title, description, details, t=null){
        try{
            const notif = await notificationModel.create({
                Title : title,
                Description : description,
                Details : details
            },{
                transaction : t
            })
            return notif
        }catch(error){
            throw new Error(error)
        }
    }

    // Read notification
    async readNotification(ID, t=null){
        try{
            await notificationModel.update({
                IsRead : 1
            }, {
                where : {
                    ID :  ID
                },
                transaction : t
            })
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = notificationService