const statusModel = require('../models/status.model')
const {getDateObj} = require('../utils/utils')

class StatusService{
    async addStatus(karyawan, t){
        try{
     
            const newStatus = await statusModel.create({
                EmployeeID : karyawan.ID,
                Status : "Active",
                Start : karyawan.Join_Date,
                End : getDateObj(karyawan.Join_Date).setMonth(getDateObj(karyawan.Join_Date).getMonth() + 6)
            }, {transaction : t})
            
            return newStatus
        }catch(error){
            throw new Error(error)
        }
    }

    async showStatus(ID){
        try{
            const status = await statusModel.findOne({
                where : {
                    EmployeeID : ID
                }
            })
            return status
        }catch(error){
            throw new Error(error)
        }
    }

    async setEndCuti(ID, endCuti){
        try{
            const changes = statusModel.update({
                End : endCuti
            },{
                where : {
                    EmployeeID : ID,
                    Status : 'Cuti'
                }
            })
            return changes
        } catch(error){
            throw new Error(error)
        }
    }

    async updateStatus(ID, status, start, end){
        try{
            const changes = statusModel.update({
                Status : status,
                Start : start,
                End : end
            }, {
                where :{
                    EmployeeID : ID
                }
            })
            return changes
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = StatusService