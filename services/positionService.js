const PositionModel = require('../models/position.model')

class PositionService{
    async upsertPosition (position, t = null) {
        try{
        
            position.Tonnage = position.Tonnage || null
    
            const [data, created] = await PositionModel.findOrCreate({
                where: {
                  Name: position.Name,
                  Tonnage : position.Tonnage
                },
                defaults : {
                    Tonnage : position.Tonnage
                },
                transaction : t
            })
            
            if(created){
                console.info("Position Created")
            }else{
                console.info(`Position ${data.Name} is exist`)
            }
            return data
        } catch(error)  {
            console.error(`Error: ${error}`);
            throw new Error(error)
        };
    }
}


module.exports = PositionService