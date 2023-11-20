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
}

module.exports = ApplicationController