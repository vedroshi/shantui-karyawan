const karyawanService = require('../services/karyawanService')

class KaryawanController {
    addKaryawan(req, res, next){
        const karyawanData = req.body
        const KTP = req.file
        
        const service = new karyawanService()
        service.addKaryawan(karyawanData, KTP)
        .then((response)=>{
            if(response){
                res.status(200).json({message : "Karyawan is Added"})
            }
        }).catch((error)=>{
            
            const errorMessage = error.message || 'Internal Server Error';
            res.status(errorMessage ? 400 : 500).json({ 
                message: errorMessage 
            });
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
}

module.exports = KaryawanController