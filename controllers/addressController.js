const AddressService = require('../services/addressService')

class AddressController { 
    async createAddress(req, res, next){
        const addressData = req.body
        const addressService = new AddressService()

        await addressService.upsertAddress(addressData)
        .then((response)=>{
            res.status(200).json(response)
        }).catch((error)=>{
            next(error)
        })
    }
}

module.exports = AddressController