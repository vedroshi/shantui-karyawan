const { sequelize } = require('../utils/db_connect')
const { Op } = require('sequelize')
const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')
const docsInit = require('../utils/docs_connect')

const contractsModel = require('../models/contracts.model')
const statusModel = require('../models/status.model')
const karyawanModel = require('../models/karyawan.model')
const positionModel = require('../models/position.model')


const PositionService = require('./positionService')
const SalaryService = require('./salaryService')

class contractService {

    async addContract(ID, start, end, t=null){
        try{
            await contractsModel.create({
                EmployeeID : ID,
                Start : start,
                End : end,
            },{
                transaction : t
            })
            return {
                status : "Created",
                message : "Contract Added"
            }
        }catch(error){
            throw new Error(error)
        }
    }

    async signContract(ID, t=null){
        try{
            await contractsModel.update({
                Signed : true
            },{ 
                where : {
                    EmployeeID : ID,
                    Signed : false
                },
                order : [
                    ['Start', 'DESC']
                ],
                limit : 1,
                transaction : t
            })
        }catch(error){

        }
    }

    async findContract(ID, t=null){
        try{
            const currentContract = await contractsModel.findOne({
                where : {
                    EmployeeID : ID
                },
                order : [
                    ['Start' , 'DESC']
                ],
                limit : 1,
                transaction : t
            })
            return currentContract
        }catch(error){
            throw new Error(error)
        }
    }

    async generateContract(ID){
        const transaction = await sequelize.transaction(async (t)=>{
            try {

                const contract = await this.findContract(ID, t)
                const options = {
                    year : 'numeric',
                    month : 'long',
                    day : '2-digit'
                }
                const start = new Date(contract.Start)
                const end = new Date(contract.End)

                
                // Generate Contract Number
                const romanMonth = ['I', 'II', "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
                const noContract = [
                    contract.No_Contract.toString().padStart(4, '0'), 
                    "HRD", 
                    "PKWT-MR", 
                    "SI", 
                    romanMonth[start.getMonth()], 
                    start.getFullYear()
                ]
            
                const contractNumber = noContract.join('/')

                // Add it to StatusModel
                await statusModel.update({
                    Contract_Number : contractNumber
                }, {
                    where : {
                        EmployeeID : ID,
                        Contract_Number : {
                            [Op.ne] : contractNumber
                        }
                    },
                    transaction : t
                })
                
                // Render Document
                const startContract = start.toLocaleDateString('id-ID', options)
                const endContract = end.toLocaleDateString('id-ID', options)

                // Get Karyawan Data
                const karyawan = await karyawanModel.findOne({
                    where : {
                        ID : ID
                    },
                    include : [{
                        model : positionModel,
                        as : "Position",
                    }],
                    transaction : t
                })
                
                // Generate Salary based on the Position
                const positionService = new PositionService()
                const salaryService = new SalaryService()

                const positionListID = await positionService.findPosition(karyawan.Position, t)
                const salary = await salaryService.findSalary(positionListID, t)

                const salaryFormatOptions =  {
                    style: 'decimal',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                  }

                const dataRender = {
                    Name : karyawan.Name.toUpperCase(),
                    ContractNumber : contractNumber,
                    StartContract : startContract,
                    StartDay : start.toLocaleDateString('id-ID', {weekday: 'long'}),
                    EndContract : endContract,
                    Address : karyawan.Address,
                    Religion : karyawan.Religion,
                    Position : karyawan.Position.Name.toUpperCase(),
                    DOB : new Date(karyawan.DOB).toLocaleDateString('id-ID', options),
                    POB : karyawan.POB,
                    Salary : {
                        Gaji_Pokok : salary.Gaji_Pokok ? salary.Gaji_Pokok.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Tunjangan : salary.Tunjangan ? salary.Tunjangan.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Upah_Perjam : salary.Upah_Perjam ? salary.Upah_Perjam.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Uang_Kehadiran : salary.Uang_Kehadiran ? salary.Uang_Kehadiran.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Overtime : salary.Overtime ? salary.Overtime.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null
                    }
                }
                
            
                const contractPath = path.join(__dirname, `../contracts/${start.toLocaleDateString('en-EN', {month : 'long'})} ${start.getFullYear()}`)
                const fileName = `PKWT - ${dataRender.Name}.docx`

   
                // Create Directory if it doesnt exists
                if(!fs.existsSync(contractPath)){
                    fs.mkdirSync(contractPath)
                }              

                // Initialize the docxtemplater
                const doc = docsInit()

                await doc.setData(dataRender)
                await doc.render()
                
                
                // // Save File Document
                // // Get the zip document and generate it as a nodebuffer
                const buf = await doc.getZip().generate({
                    type: "nodebuffer",
                    // compression: DEFLATE adds a compression step.
                    // For a 50MB output document, expect 500ms additional CPU time
                    compression: "DEFLATE",
                });


                // buf is a nodejs Buffer, you can either write it to a
                // file or res.send it with express for example.
                //  Contract File Path
                const filePath = path.join(contractPath, fileName)

                fs.writeFileSync(filePath, buf);

                return{ 
                    status : "Success",
                    data : dataRender,
                    path : filePath,
                    message : "Contract Generated"
                }

            } catch (error) {
                t.rollback()
                throw new Error(error)
            }
        })
        return transaction
    }
}

module.exports = contractService