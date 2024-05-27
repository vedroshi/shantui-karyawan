const { sequelize } = require("../utils/db_connect");
const { getDateObj, displayDate, formatDate } = require('../utils/utils')


const positionService = require("./positionService");
const companyService = require("./companyService");
const StatusService = require("./statusService");
const LogService = require("./logService");
const ApplicationService = require("./applicationService");
const CalendarService = require("./calendarService");

const positionModel = require("../models/position.model");
const karyawanModel = require("../models/karyawan.model");
const statusModel = require("../models/status.model");
const companyModel = require("../models/company.model");
const siteModel = require("../models/site.model");
const applicationModel = require("../models/application.model");
const logModel = require('../models/log.model');

const { Op } = require("sequelize");

const logger = require('../utils/logger');


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
          const lService = new LogService();
          const calendarService = new CalendarService();

          // Add Position and Company they are assigned to
          const position = await pService.upsertPosition(positionData, t);
          const company = await cService.upsertCompany(companyData, t);

          // Add Employee
          const karyawan = await karyawanModel.create({
            NIK: data.NIK,
            Name: data.Name,
            DOB: data.DOB,
            POB: data.POB,
            Address: data.Address,
            Religion: data.Religion,
            Join_Date: data.Join_Date,
            PositionID: position.ID,
            CompanyID: company.ID,
            KTP: KTP.name || KTP.filename
          }, { transaction: t });

          if (karyawan) {
            // Create Status and Application
            await sService.addStatus(karyawan, t);
            await appService.addApplication(karyawan.ID, t);

            // Create Event to Calendar Agenda
            // Start Date
            await calendarService.addEvent({
              Title: data.Name,
              Tags: "Join",
              Description: "Masuk Kerja",
              Start: data.Join_Date
            }, t)

            // End Date
            await calendarService.addEvent({
              Title: data.Name,
              Tags: "Expired",
              Description: "Jatuh Tempo Kontrak",
              Start: getDateObj(data.Join_Date).setMonth(getDateObj(data.Join_Date).getMonth() + 6)
            }, t)

            // Log
            const logData = {
              Start: data.Join_Date,
              End: getDateObj(data.Join_Date).setMonth(getDateObj(data.Join_Date).getMonth() + 6),
              Type: "Contract",
              Message: `Masuk Kerja di tanggal ${displayDate(getDateObj(data.Join_Date))}`
            }

            // Add Log
            await lService.createLog(karyawan.ID, logData, t)
          }

          logger.info("Karyawan Added");

          return karyawan;

        } catch (error) {
          logger.error(error)
          await t.rollback();
          // Check if the error is a SequelizeUniqueConstraintError
          if (error.name === "SequelizeUniqueConstraintError") {
            // Handle unique constraint violation, e.g., send a specific error message
            const errorMessage = JSON.stringify(error.errors[0].message).match(/"([^"]*)"/)[1];
            throw new Error(errorMessage);
          } else {
            // Rollback the transaction if another error occurs
            // Re-throw the error to be caught by the calling function
            throw error
          }
        }
      });

      return newKaryawan;
    } catch (error) {
      throw error;
    }
  }

  async showKaryawan() {
    try {
      const karyawan = await karyawanModel.findAll({
        attributes: {
          exclude: ['CompanyID', 'PositionID'],
        },
        include: [
          {
            model: positionModel,
            as: 'Position',
          },
          {
            model: companyModel,
            as: 'Company',
            attributes: {
              exclude: ['SiteID']
            },
            include: [{
              model: siteModel
            }]
          },
          {
            model: statusModel,
            as: 'Status'
          },
          {
            model: applicationModel,
            as: 'Application'
          },
          {
            model: logModel,
            as: 'Logs'
          }
        ]
      })

      return karyawan
    } catch (error) {
      throw new Error(error)
    }
  }

  async getKaryawan(ID, t = null) {
    try {
      const karyawan = await karyawanModel.findOne({
        where: {
          ID: ID
        },
        limit: 1,
        transaction: t
      })
      return karyawan
    } catch (error) {
      throw error
    }
  }

  async getKaryawanList(IDList, t = null) {
    try {
      const karyawan = await karyawanModel.findAll({
        attributes: ['Name'],
        where: {
          ID: {
            [Op.in]: IDList
          }
        },
        transaction: t
      })
      return karyawan
    } catch (error) {
      throw new Error(error)
    }
  }

  async checkApplication() {
    try {
      const updatelog = []
      const transaction = sequelize.transaction(async (t) => {
        try {
          const statusService = new StatusService()
          const karyawan = await karyawanModel.findAll({
            include: [{
              model: applicationModel,
              as: 'Application',
              where: {
                '$Application.Start$': {
                  [Op.lte]: formatDate(new Date())
                },
                '$Application.Application_Status$': 'Accepted',
              },
            },
            {
              model: statusModel,
              as: 'Status',
              where: {
                '$Status.End$' : {
                  [Op.gt] : formatDate(new Date()),
                }
              }
            },
            ],
            transaction: t
          })

          for (const employee of karyawan) {
            const application = employee.Application

            // Set Status and Add Log
            if (application.Application_Type == "Cuti") {
              // Set Cuti
              await statusService.setCuti(employee, application, t)

              // Add Log (Server)
              updatelog.push({
                ID: employee.ID,
                message: "This Employee takes a Leave",
                type: "Cuti"
              })
            }

            else if (application.Application_Type == "Resign") {
              // Set Resign
              await statusService.resign(employee.ID, application.Start, t)

              // Add Log (Server)
              updatelog.push({
                ID: employee.ID,
                message: "Employee Resign",
                type: "Resign"
              })
            }

          }
          logger.info(updatelog)
          return updatelog
        } catch (error) {
          t.rollback()
          logger.error(error)
          throw new Error(error)
        }
      })
      return transaction
    } catch (error) {
      throw error
    }
  }

  //get karyawan with the latest update
  async getLatestUpdate() {
    try {
      const karyawan = karyawanModel.findAll({
        include: [{
          model: statusModel,
          as: "Status",
        }, {
          model: applicationModel,
          as: "Application"
        }, {
          model: companyModel,
          as: 'Company',
          attributes: {
            exclude: ['SiteID']
          },
          include: [{
            model: siteModel
          }]
        }, {
          model: positionModel,
          as: "Position"
        }],
        order: [[{ model: statusModel, as: 'Status' }, 'updatedAt', 'DESC']],
        limit: 10
      })
      return karyawan
    } catch (error) {
      throw new Error(error)
    }
  }

  async updateJoinDate(ID, date, t = null) {
    try {
      const joinDate = await karyawanModel.update({
        Join_Date: date
      }, {
        where: {
          ID: ID
        },
        transaction: t
      })
      return joinDate
    } catch (error) {
      throw error
    }
  }

  async rejoin(ID, date) {
    const statusService = new StatusService()
    const calendarService = new CalendarService()
    const logService = new LogService()

    const transaction = sequelize.transaction(async (t) => {
      try {
        // Define Start Date and End Date
        let start = date
        let end = new Date(date)
        end.setMonth(end.getMonth() + 6)
        end = formatDate(end)

        const karyawan = await this.getKaryawan(ID, t)


        // Update Join Date
        await this.updateJoinDate(ID, start, t)

        // Update Status
        await statusService.updateStatus(ID, "Active", start, end, t)

        // Create Event to Calendar Agenda
        // Start Date
        await calendarService.addEvent({
          Title: karyawan.Name,
          Tags: "Join",
          Description: "Masuk Kerja",
          Start: start
        }, t)

        // End Date
        await calendarService.addEvent({
          Title: karyawan.Name,
          Tags: "Expired",
          Description: "Jatuh Tempo Kontrak",
          Start: end
        }, t)

        // Log
        const logData = {
          Start: start,
          End: end,
          Type: "Contract",
          Message: `Balik Kerja di tanggal ${displayDate(getDateObj(start))}`
        }

        // Add Log
        await logService.createLog(karyawan.ID, logData, t)

        return {
          status: "Active",
          Start: start,
          End: end,
        }
      } catch (error) {
        t.rollback()
        throw error
      }
    })
    return transaction
  }
}

module.exports = karyawanService;
