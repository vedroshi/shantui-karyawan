const siteModel = require('../models/site.model')
const companyModel = require('../models/company.model')

const {Op} = require('sequelize')

class CompanyService{
    async upsertCompany(company, t = null){
        try { 
            const [site, site_created] = await siteModel.findOrCreate({
                where : {
                    Name : company.Site
                },
                transaction : t
            })

            if(site_created){
                console.info("Site Added to Database")
            }else{
                console.info(`Site ${site.Name} already exist`)
            }

            company.SiteID = site.ID
            const [newCompany, created] = await companyModel.findOrCreate({
                where : {
                    [Op.and] : {
                        Name : company.Name,
                        SiteID : company.SiteID
                    }
                },
                defaults: { 
                    SiteID: site.ID, 
                    Name: company.Name 
                },
                transaction : t
            })
            if(created){
                console.info("Company Added to Database")
            }else{
                console.info(`Company ${newCompany.Name} is Already Exist`)
            }

            return site, newCompany
        }catch(error){
            throw new Error(error)
        }
    }
}

module.exports = CompanyService