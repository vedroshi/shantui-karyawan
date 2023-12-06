const { sequelize } = require("../utils/db_connect");
const { getDateObj, displayDate } = require('../utils/utils')

const karyawanModel = require("../models/karyawan.model");

const positionService = require("./positionService");
const companyService = require("./companyService");
const StatusService = require("./statusService");
const LogService = require("./logService");
const ApplicationService = require("./applicationService");


const positionModel = require("../models/position.model");
const statusModel = require("../models/status.model");
const companyModel = require("../models/company.model");
const siteModel = require("../models/site.model");
const applicationModel = require("../models/application.model");
const logModel = require('../models/log.model');
const { Op } = require("sequelize");


class karyawanService {
  async addKaryawan(data, file) {
    try {
      const positionData = data.Position;
      const companyData = data.Company;
      const KTP = file

      const newKaryawan = sequelize.transaction(async (t) => {
        try {

          const pService = new positionService();
          const cService = new companyService();
          const sService = new StatusService();
          const appService = new ApplicationService();
          const lService = new LogService()

          const position = await pService.upsertPosition(positionData, t);
          const company = await cService.upsertCompany(companyData, t);

          const karyawan = await karyawanModel.create({
            NIK: data.NIK,
            Name: data.Name,
            DOB: data.DOB,
            POB: data.POB,
            Address : data.Address,
            Religion: data.Religion,
            Join_Date: data.Join_Date,
            PositionID: position.ID,
            CompanyID: company.ID,
            KTP : KTP.name || KTP.filename
          }, {transaction : t});

          if(karyawan){
            await sService.addStatus(karyawan, t);
            await appService.addApplication(karyawan.ID, t);
            
            // Log
            const logData  = {
              Start : data.Join_Date,
              End : getDateObj(data.Join_Date).setMonth(getDateObj(data.Join_Date).getMonth() + 6),
              Type : "Contract",
              Message : `Masuk Kerja di tanggal ${displayDate(getDateObj(data.Join_Date))}`
            }
            await lService.createLog(karyawan.ID, logData, t)
          }

          return karyawan;
        } catch (error) {
            
          await t.rollback();
          // Check if the error is a SequelizeUniqueConstraintError
          if (error.name === "SequelizeUniqueConstraintError") {
            // Handle unique constraint violation, e.g., send a specific error message
            const errorMessage = JSON.stringify(error.errors[0].message).match(/"([^"]*)"/)[1];
            throw new Error(errorMessage);
          } else {
            // Rollback the transaction if another error occurs
            // Re-throw the error to be caught by the calling function
            throw new Error(error);
          }
        }
      });

      return newKaryawan;
    } catch (error) {
      throw error;
    }
  }
  
  async showKaryawan(){
    try { 
      const karyawan = await karyawanModel.findAll({
        attributes: {
          exclude: [ 'CompanyID', 'PositionID'],
        },
        include : [
        {
          model: positionModel,
          as: 'Position',
        },
        {
          model: companyModel,
          as: 'Company',
          attributes : {
            exclude : ['SiteID']
          },
          include : [{
            model : siteModel
          }]
        },
        {
          model: statusModel,
          as : 'Status'
        },
        {
          model : applicationModel,
          as : 'Application'
        },
        {
          model : logModel,
          as : 'Logs'
        }
      ]
      })

      return karyawan
    }catch(error){
      throw new Error(error)
    }
  }

}

module.exports = karyawanService;
