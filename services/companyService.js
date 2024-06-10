const siteModel = require('../models/site.model')
const companyModel = require('../models/company.model')

const {Op} = require('sequelize')
const { sequelize } = require('../utils/db_connect')

class CompanyService{
    async upsertCompany(site, company, t = null){
        try { 
            const [newSite, site_created] = await siteModel.findOrCreate({
                where : {
                    Name : site
                },
                transaction : t
            })

            if(site_created){
                console.info("Site Added to Database")
            }else{
                console.info(`Site ${newSite.Name} already exist`)
            }

            // company.SiteID = site.ID
            const [newCompany, company_created] = await companyModel.findOrCreate({
                where : {
                    [Op.and] : {
                        Name : company,
                        SiteID : newSite.ID
                    }
                },
                defaults: { 
                    SiteID: newSite.ID, 
                    Name: company
                },
                transaction : t
            })

            if(company_created){
                console.info("Company Added to Database")
            }else{
                console.info(`Company ${newCompany.Name} is Already Exist`)
            }
            
            return newSite, newCompany
        }catch(error){
            throw new Error(error)
        }
    }

    async listSites(){
        try{
            const sites = await siteModel.findAll()
            return sites
        }catch(error){
            throw error
        }
    }

    async listUsers(site){
        const transaction = await sequelize.transaction(async (t) =>{
            try{
                const siteID = await siteModel.findOne({
                    attributes : ["ID"],
                    where : {
                        Name : site
                    },
                    transaction : t
                })

                const users = await companyModel.findAll({
                    attributes : {
                        exclude : ['SiteID']
                    },
                    where : {
                        SiteID : siteID.ID
                    },
                    transaction : t
                })

                return users
            }catch(error){
                t.rollback()
                throw error
            }
        })
        return transaction
    }
}

module.exports = CompanyService