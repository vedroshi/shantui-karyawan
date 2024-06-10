const CompanyService = require('../services/companyService')

class companyController {
    async addCompany(req, res, next){
        const company = req.body
        const companyService = new CompanyService()

        await companyService.upsertCompany(company)
        .then((response)=>{
            res.status(200).json(response)
        })
        .catch((error)=>{
            next(error)
        })
    }
    
    async listSites(req, res, next){
        const service  = new CompanyService()

        await service.listSites()
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    async listUsers(req, res, next){
        const site = req.query.site
        const service = new CompanyService()
        await service.listUsers(site)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            if(error.message == "Cannot read properties of null (reading 'ID')"){
                res.status(404).json({
                    success : false,
                    message : "Site does not exists"
                })
            }else{
                next(error)
            }
        })
    }
}

module.exports = companyController