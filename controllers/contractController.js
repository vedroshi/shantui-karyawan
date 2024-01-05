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
}

module.exports = ContractController
