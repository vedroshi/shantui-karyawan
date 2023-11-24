const { Op } = require('sequelize')
const logModel = require('../models/log.model')

const { formatDate } = require('../utils/utils')

class LogService {
    async createLog(ID, data, t=null){
        try{
            const new_log = await logModel.create({
                EmployeeID : ID,
                CreatedAt : formatDate(new Date()),
                Start : data.Start,
                End : data.End,
                Type : data.Type,
                Message : data.Message,
            }, {
                transaction : t
            })
    
            return new_log
        }catch(error){
            throw new Error(error)
        }
    }

    async showLogs(ID){
        try {
            const logs = await logModel.findAll({
                where : {
                    EmployeeID : ID
                },
                attributes : {
                    exclude : ['ID'],
                },
                order : [
                    ['CreatedAt' , 'ASC'],
                    ['ID' , 'ASC']
                ]
            })

            return logs
        } catch (error){
            throw new Error(error)
        }
    }

    async checkLastContract(ID){
        try { 
            const lastContract = await logModel.findOne({
                where : {
                    [Op.and] : {
                        EmployeeID : ID,
                        Type : "Contract"
                    }
                },
                order : [
                    ['ID', 'DESC'],
                    ['CreatedAt' , 'DESC'],
                ],
                limit : 1
            })
            
            return lastContract
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = LogService