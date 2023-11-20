const statusService = require('../services/statusService')

class statusController {
    async setEndCuti(req, res, next){
        const data = req.body
        const id = req.params.id
        const services = new statusService()

        await services.setEndCuti(id, data.End_Cuti)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    end : data.End_Cuti,
                    message : "End Cuti is Set"
                })
            }
        }).catch((error)=>{
            console.log(error)
            next(error)
        })

    }
}

module.exports = statusController