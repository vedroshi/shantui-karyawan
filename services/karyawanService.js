const { sequelize } = require("../utils/db_connect");
const karyawanModel = require("../models/karyawan.model");

const positionService = require("./positionService");
const addressService = require("./addressService");
const companyService = require("./companyService");
const StatusService = require("./statusService");

const addressModel = require("../models/address.model");
const positionModel = require("../models/position.model");
const statusModel = require("../models/status.model");
const companyModel = require("../models/company.model");
const siteModel = require("../models/site.model");
const ApplicationService = require("./applicationService");
const ApplicationModel = require("../models/application.model");

class karyawanService {
  async addKaryawan(data, file) {
    try {
      const positionData = data.Position;
      const addressData = data.Address;
      const companyData = data.Company;
      const KTP = file

      const newKaryawan = sequelize.transaction(async (t) => {
        try {
          const aService = new addressService();
          const pService = new positionService();
          const cService = new companyService();
          const sService = new StatusService();
          const appService = new ApplicationService();

          const address = await aService.upsertAddress(addressData);
          const position = await pService.upsertPosition(positionData);
          const company = await cService.upsertCompany(companyData);

          const karyawan = await karyawanModel.create({
            NIK: data.NIK,
            Name: data.Name,
            DOB: data.DOB,
            POB: data.POB,
            Religion: data.Religion,
            Join_Date: data.Join_Date,
            AddressID: address.ID,
            PositionID: position.ID,
            CompanyID: company.ID,
            KTP : KTP.name || KTP.filename
          });

          if(karyawan){
            await sService.addStatus(karyawan);
            await appService.addApplication(karyawan);
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
          exclude: ['AddressID', 'CompanyID', 'PositionID'],
        },
        include : [{
          model: addressModel,
          as: 'Address',
        },
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
          model : ApplicationModel,
          as : 'Application'
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
