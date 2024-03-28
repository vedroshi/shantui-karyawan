const { Op } = require('sequelize')
const calendarModel = require('../models/calendar.model')

class CalendarService {
    async addEvent(data, t=null){
        try{
            await calendarModel.create({
                Title : data.Title,
                Tags : data.Tags,
                Start : data.Start,
                Description : data.Description,
            }, {
                transaction : t
            })
        }catch(error){
            throw new Error(error)
        }
    }

    async getEvents(start, end, t=null){
        try{
            const events = await calendarModel.findAll({
                where : {
                    Start : {
                        [Op.between] : [start, end]
                    }
                },
                transaction : t
            })
            return events
        }catch(error){
            throw new Error(error)
        }
    }

    async findEvent(data, t=null){
        try{
            const agenda = await calendarModel.findOne({
                where : {
                    [Op.and] : {
                        Tags : data.Tags,
                        Title : data.Title,
                        Start : data.Start
                    }
                },
                transaction : t
            })
            return agenda
        }catch(error){
            throw new Error(error)
        }
    }

    async updateEvent(ID, data, t=null){
        try{
            await calendarModel.update(data, {
                where : {
                    ID : ID
                },
                transaction : t
            })
        }catch(error){
            throw new Error(error)
        }
    }

    async deleteEvents(title, date, t=null){
        try{
            await calendarModel.destroy({
                where : {
                    Title : title,
                    Start : {
                        [Op.gt] : date
                    }
                },
                transaction : t
            })
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = CalendarService