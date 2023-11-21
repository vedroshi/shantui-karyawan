const applicationService = require('../services/applicationService')

class ApplicationController {
    async applyForm(req, res, next){
        const id = req.params.id
        const formData = req.body

        const service = new applicationService()
        await service.apply(id, formData)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    application: formData,
                    message : 'Application Submitted'
                })
            }
        }).catch((error)=>{
            next(error)
        })
    }

    async approve(req, res, next){
        const id  = req.params.id
        const service = new applicationService()

        await service.approve(id)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    status : "Accepted",
                    message : "Application Approved"
                })
            }
        }).catch((error)=>{
            if(error.message == "Application not Found"){
                res.status(404).json({
                    message : error.message
                })
            }else{
                next(error)
            }
        })
    }

    async reject(req, res, next){
       const id = req.params.id
       const service = new applicationService()
       await service.reject(id)
       .then((response)=>{
            if(response){
                res.status(200).json({
                    status : "Rejected",
                    message : "Application Rejected"
                })
            }
       }).catch((error)=>{
            if(error.message == "Application not Found"){
                res.status(404).json({
                    message : error.message
                })
            }else{
                next(error)
            }
       })
    }
}

module.exports = ApplicationController