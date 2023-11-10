const AddressModel = require('../models/address.model')

class AddressService{
    async upsertAddress(address){
        try{
            address.RT = address.RT || null
            address.RW = address.RW || null
            address.Village = address.Village || null
            address.Subdistrict = address.Subdistrict || null
            address.Province = address.Province || null

            const [data, created] = await AddressModel.findOrCreate({
                where : {
                    Address : address.Address,
                    RT : address.RT,
                    RW : address.RW,
                    Village : address.Village,
                    Subdistrict : address.Subdistrict,
                    Province : address.Province
                },
                defaults : {
                    RT : address.RT,
                    RW : address.RW,
                    Village : address.Village,
                    Subdistrict : address.Subdistrict,
                    Province : address.Province
                }
            })

            if (created){
                console.info("Address Created")
            }else{
                console.info(`Address ID : ${data.ID}`)
            }
            
            return data
        }catch(error){
            console.error(`Error : ${error}`)
            throw new Error(error)
        }
    }
}

module.exports = AddressService