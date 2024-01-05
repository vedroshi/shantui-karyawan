const PositionModel = require('../models/position.model')
const positionListModel = require('../models/positionlist.model')

const {Op} = require('sequelize')

class PositionService{
    async upsertPosition (position, t=null) {
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

    async findPosition(employeePosition, t=null){
        try{
            const position = await positionListModel.findOne({
                attributes : ['ID'],
                where : {
                    Position_Name : employeePosition.Name,
                    [Op.and] : [
                        {
                            [Op.or] : [{
                                Max_Tonnage : {
                                    [Op.gte] : employeePosition.Tonnage
                                } ,
                            },
                            {
                                Max_Tonnage : null
                            }],
                        },
                        {
                            [Op.or] : [{
                                Min_Tonnage : {
                                    [Op.lte] : employeePosition.Tonnage
                                },
                            },
                            {
                                Min_Tonnage : null
                            }]
                        }
                    ]
                },
                transaction : t
            })
            
            return position.ID
        }catch(error){
            throw error
        }
    }
}


module.exports = PositionService