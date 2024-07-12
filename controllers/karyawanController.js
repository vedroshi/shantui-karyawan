const karyawanService = require('../services/karyawanService')

class KaryawanController {
    addKaryawan(req, res, next){
        const karyawanData = req.body
        const KTP = req.file
        
        const service = new karyawanService()
        service.addKaryawan(karyawanData, KTP)
        .then((response)=>{
            if(response){
                res.status(200).json({
                    message : "Karyawan is Added"
                })
            }
        }).catch((error)=>{
            next(error)
        })
        
    }

    showKaryawan(req, res, next){
        const service = new karyawanService()
        service.showKaryawan()
        .then((response)=>{
            if(response){
                res.status(200).json(response)
            }
        }).catch((error)=>{
            res.status(500).json(error)
        })
    }

     // Check if there is an application before the contract ends
    async checkApplication(req, res, next){
        const service = new karyawanService()

        await service.checkApplication()
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    // get latest update
    async getLatestUpdate(req, res, next){
        const service = new karyawanService()

        await service.getLatestUpdate()
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }

    // Rejoin
    async rejoin(req, res, next){
        const id = req.params.id
        const date = req.body.Date

        const service = new karyawanService()
        await service.rejoin(id, date)
        .then((response)=>{
            res.status(200).json({
                success : true,
                message : "karyawan Rejoin",
                contract : response,
            })
        }).catch((error)=>{
            next(error)
        })
    }

    // Mutasi
    async mutasi(req, res, next){
        const id = req.params.id
        const data = req.body
        const service = new karyawanService()
        
        await service.mutasi(id, data)
        .then((response)=>{
            res.status(200).json({
                success : true,
                message : "Mutasi Successful"
            })
        }).catch((error)=>{
            next(error)
        })
    }

    async editPosition(req, res, next){
        const id = req.params.id
        const data = req.body
        const service = new karyawanService()
        
        await service.editPosition(id, data)
        .then((response)=>{
            res.status(200).json({
                success : true,
                message : 'Position Edited'
            })
        }).catch((error)=>{
            next(error)
        })
    }

}

module.exports = KaryawanController