const { sequelize } = require('../utils/db_connect')
const { Op } = require('sequelize')
const fs = require('fs')
const path = require('path')
const docsInit = require('../utils/docs_connect')

const contractsModel = require('../models/contracts.model')
const karyawanModel = require('../models/karyawan.model')
const positionModel = require('../models/position.model')

const { getDateObj, formatDate } = require('../utils/utils')

class contractService {

    async addContract(ID, start, end, t = null) {
        try {
            await contractsModel.create({
                EmployeeID: ID,
                Start: start,
                End: end,
            }, {
                transaction: t
            })
            return {
                status: "Created",
                message: "Contract Added"
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    async signContract(No_Contract, t = null) {
        try {
            await contractsModel.update({
                Signed: true
            }, {
                where: {
                    No_Contract : No_Contract,
                    Signed: false
                },
                order: [
                    ['Start', 'DESC']
                ],
                limit: 1,
                transaction: t
            })
        } catch (error) {

        }
    }

    async findContract(ID, t = null) {
        try {
            const currentContract = await contractsModel.findOne({
                where: {
                    EmployeeID: ID
                },
                order: [
                    ['Start', 'DESC']
                ],
                limit: 1,
                transaction: t
            })
            return currentContract
        } catch (error) {
            throw new Error(error)
        }
    }

    async generateContract(ID) {
        const PositionService = require('./positionService')
        const ApplicationService = require('./applicationService')
        const SalaryService = require('./salaryService')
        const StatusService = require('./statusService')

        const transaction = await sequelize.transaction(async (t) => {
            try {

                let contract = await this.findContract(ID, t)

                // Get Status
                const statusService = new StatusService()
                const status = await statusService.showStatus(ID)

                // Get Application
                const applicationService = new ApplicationService()
                const application = await applicationService.getApplication(ID, t)

                // renew contract if karyawan (Warning) applied for compensation form and accepted
                if (application.Application_Type == "Kompensasi" && application.Application_Status == "Accepted" && (status.Status == 'Warning' || status.Status == "Close Project")) {
                    // If contract is the previous one -> create a new one (to prevent duplicate)
                    if (getDateObj(contract.Start) < new Date()) {
                        await this.addContract(ID, application.Start, application.End, t)
                        contract = await this.findContract(ID, t)
                    }
                }

                // create new contract if karyawan Return (Cuti) & Set up date for Contract Date
                if (status.Status == "Cuti") {
                    // Start -> status.End
                    // End -> status.End + 6 Months

                    // If contract is the old -> create a new one (to prevent duplicate)
                    if (getDateObj(contract.Start) < new Date()) {
                        // Define new Contract Period
                        const start = status.End
                        const end = new Date(start)
                        end.setMonth(end.getMonth() + 6)

                        // Create new Contract
                        await this.addContract(ID, start, formatDate(end), t)
                        contract = await this.findContract(ID, t)
                    }
                }

                // create new contract if contract not exists/expired
                if (!contract || getDateObj(contract.End) < new Date()) {
                    await this.addContract(ID, status.Start, status.End, t)
                    contract = await this.findContract(ID, t)
                }

                const options = {
                    year: 'numeric',
                    month: 'long',
                    day: '2-digit'
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
                await statusService.updateContractNumber(ID, contractNumber, t)

                // Render Document
                const startContract = start.toLocaleDateString('id-ID', options)
                const endContract = end.toLocaleDateString('id-ID', options)

                // Get Karyawan Data
                const karyawan = await karyawanModel.findOne({
                    where: {
                        ID: ID
                    },
                    include: [{
                        model: positionModel,
                        as: "Position",
                    }],
                    transaction: t
                })

                // Generate Salary based on the Position
                const positionService = new PositionService()
                const salaryService = new SalaryService()

                const positionListID = await positionService.findPosition(karyawan.Position, t)
                const salary = await salaryService.findSalary(positionListID, t)


                const salaryFormatOptions = {
                    style: 'decimal',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                }

                // Set Salary from 3.500.000 to 3.000.000 for employee in a certain position
                const excPosition = [
                    "Operator Crane", "Operator Excavator", "Operator Loader",
                    "HSE", "Leader Bobok", "Leader Support", "Mekanik Leader", "Foreman",
                    "SPV Foreman", "Jubir"
                ]
                
                // Checking if the employee is working for less than 6 months
                if((start - getDateObj(karyawan.Join_Date) < 6 * 30 * 24 * 60 * 60 * 1000) && !excPosition.includes(karyawan.Position.Name) ){
                    // Update "Gaji Pokok"
                    salary.Gaji_Pokok = 3000000
                }
                
                // Uang Kehadiran HSE
                if((start - getDateObj(karyawan.Join_Date) < 6 * 30 * 24 * 60 * 60 * 1000) && karyawan.Position.Name == "HSE" ){
                    // Update "Gaji Pokok"
                    salary.Uang_Kehadiran = 2500000
                }

                // Work Duration Setup
                const operators = [
                    "Operator Crane", "Operator Excavator", "Operator Loader", "Operator Dozer",
                    "Driver Mixer", "Driver DT", "Driver LV", "Driver LT", "Driver Menhol",
                    "Driver Trailer", "Operator Yapcrane"
                ]

                const staffs = [
                    "Mekanik", "Helper", "Mekanik Junior", "Mekanik Repair", "Mekanik Crane", "Mekanik Leader",
                    "Helper Assembling", "Tyreman", "SPV Tyreman", "Leader Tyreman", "Leader Bobok",
                    "Bobok", "Leader Support", "Logistic", "Assembly", "OP Bubut", "Welder"
                ]

                const admins = [
                    "Admin", "Admin Plant", "HR", "Accounting", "Bobok", "Service Man", "Cleaning Service"
                ]

                let workDuration = {
                    Duration : "-",
                    Break : "-"
                }

                if(operators.includes(karyawan.Position.Name)){
                    workDuration.Duration = "07.00 - 17.00"
                    workDuration.Break = "2 Jam / hari"
                }else if(admins.includes(karyawan.Position.Name)){
                    workDuration.Duration = "08.00 - 17.30"
                    workDuration.Break = "11.30 - 13.30"
                }else if(staffs.includes(karyawan.Position.Name)){
                    workDuration.Duration = "Shift 1 : 07.00 - 17.00 \nShift 2 : 10.00 - 21.00 \nShift 3 : 20.00 - 07.00"
                    workDuration.Break = "1 Jam / hari"
                }

                const dataRender = {
                    Name: karyawan.Name.toUpperCase(),
                    ContractNumber: contractNumber,
                    StartContract: startContract,
                    StartDay: start.toLocaleDateString('id-ID', { weekday: 'long' }),
                    EndContract: endContract,
                    Address: karyawan.Address,
                    Religion: karyawan.Religion,
                    Position: karyawan.Position.Name.toUpperCase(),
                    DOB: new Date(karyawan.DOB).toLocaleDateString('id-ID', options),
                    POB: karyawan.POB,
                    Salary: {
                        Gaji_Pokok: salary.Gaji_Pokok ? salary.Gaji_Pokok.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Tunjangan: salary.Tunjangan ? salary.Tunjangan.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Upah_Perjam: salary.Upah_Perjam ? salary.Upah_Perjam.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Uang_Kehadiran: salary.Uang_Kehadiran ? salary.Uang_Kehadiran.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null,
                        Overtime: salary.Overtime ? salary.Overtime.toLocaleString('en-US', salaryFormatOptions).replace(/,/g, '.') : null
                    },
                    Durations : workDuration
                }

                const contractPath = path.join(__dirname, `../contracts/${start.toLocaleDateString('en-EN', { month: 'long' })} ${start.getFullYear()}`)
                const fileName = `PKWT - ${dataRender.Name}.docx`


                // Create Directory if it doesnt exists
                if (!fs.existsSync(contractPath)) {
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

                return {
                    success : true,
                    data: dataRender,
                    path: filePath,
                    message: "Contract Generated"
                }

            } catch (error) {
                t.rollback()
                throw new Error(error)
            }
        })
        return transaction
    }

    async showContract(month, year){
    
        const contracts = await contractsModel.findAll({
            attributes : {
                exclude : ['EmployeeID', 'createdAt']
            },
            include : [{
                model : karyawanModel,
                attributes : ["Name", "Join_Date"]
            }],
            where : {
                [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('Start')), month),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Start')), year),
                ],
            },
        })
        return contracts
    }

    async getPeriodList(){
        try{
            const periodList = sequelize.query(`
                select distinct 
                month(Start) as month, year(start) as year from contracts 
                GROUP BY YEAR(Start), MONTH(Start) 
                ORDER BY year DESC, month DESC;
            `,{
                type : sequelize.QueryTypes.SELECT
            })

            return periodList
        }catch(error){
            throw error
        }

    }
}

module.exports = contractService