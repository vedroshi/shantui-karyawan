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

    // Get Notifications
    async getNotifications(page){
        try{
            const notifications = await notificationModel.findAll({
                group : ['ID', 'createdAt'],
                order :[ 
                    ['createdAt', 'DESC']
                ],
                limit : 10,
                offset : page * 10
            })
            return notifications
        }catch(error){
            throw new Error(error)
        }
    }

    // Read All Notification
    async readAllNotification(){
        try{
            await notificationModel.update({
                IsRead : 1
            }, {
                where : {
                    IsRead : 0
                }
            })
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = notificationService