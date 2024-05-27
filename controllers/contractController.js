const contractService = require('../services/contractService')

class ContractController{
    generateContract(req, res, next){
        const service = new contractService()
        const id = req.params.id
        
        service.generateContract(id)
        .then((response)=>{
            // res.status(200).json(response)
            
            res.setHeader('Content-Transfer-Encoding', 'binary'); // Add this line
            res.download(response.path, (err)=>{
                if(err){
                    next("Download Failed")
                }else{
                    console.log("Download Success")
                }
            })
        }).catch((error)=>{
            next(error)
        })  
    }

    showContracts(req, res, next){
        const month = req.query.month
        const year = req.query.year

        const service = new contractService()

        service.showContract(month, year)
        .then((response)=>{
            res.status(200).json({
                success : true,
                message : "Contracts Displayed",
                contracts : response
            })
        }).catch((error)=>{
            next(error)
        })
    }

    signContract(req, res, next){
        const service = new contractService()
        const No_Contract = req.params.no

        service.signContract(No_Contract)
        .then((response)=>{
            res.status(200).json(({
                success : true,
                message : 'Contract Signed',
            }))
        }).catch((err)=>{
            next(err)
        })
    }

    getPeriod(req, res, next){
        const service = new contractService()

        service.getPeriodList()
        .then((response)=>{
            res.status(200).json({
                success : true,
                message : "Period Listed",
                period : response
            })
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = ContractController
