const contractsModel = require('../models/contracts.model')

class contractService {

    async addContract(ID, start, end, t=null){
        try{
            await contractsModel.create({
                EmployeeID : ID,
                Start : start,
                End : end,
            },{
                transaction : t
            })
            return {
                status : "Created",
                message : "Contract Added"
            }
        }catch(error){
            throw new Error(error)
        }
    }

    async signContract(ID, t=null){
        try{
            await contractsModel.update({
                Signed : true
            },{ 
                where : {
                    EmployeeID : ID,
                    Signed : false
                },
                order : [
                    ['Start', 'DESC']
                ],
                limit : 1,
                transaction : t
            })
        }catch(error){

        }
    }

    async findContract(ID, t=null){
        try{
            const currentContract = await contractsModel.findOne({
                where : {
                    EmployeeID : ID
                },
                order : [
                    ['Start' , 'DESC']
                ],
                limit : 1
            })
            return currentContract
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = contractService