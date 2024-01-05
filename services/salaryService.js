const salaryModel = require('../models/salary.model')

class SalaryService {
    async findSalary(PositionID, t=null){
        try{
            const salary = salaryModel.findOne({
                attributes : {
                    exclude : ['ID', 'PositionListID']
                },
                where : {
                    PositionListID : PositionID
                },
                transaction : t
            })
           
            return salary
        }catch(error){
            throw error
        }
    }
    
}

module.exports = SalaryService