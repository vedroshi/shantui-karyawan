const statusModel = require('../models/status.model')
const {getDateObj} = require('../utils/utils')

class StatusService{
    async addStatus(karyawan){
        try{
     
            const newStatus = await statusModel.create({
                EmployeeID : karyawan.ID,
                Status : "Active",
                Start : karyawan.Join_Date,
                End : getDateObj(karyawan.Join_Date).setMonth(getDateObj(karyawan.Join_Date).getMonth() + 6)
            })
            
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
}

module.exports = StatusService