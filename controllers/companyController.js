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
}

module.exports = companyController