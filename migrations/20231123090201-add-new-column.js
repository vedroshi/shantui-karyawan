'use strict';
const {DataTypes} = require('sequelize')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    queryInterface.addColumn("log_karyawan", "Type", {
      type : DataTypes.ENUM("Contract", "Apply", "Cuti", "Resign"),
      allowNull : true
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.removeColumn("log_karyawan", "Type", {
      type : DataTypes.ENUM("Contract", "Apply", "Cuti", "Resign"),
      allowNull : true
    })
  }
};
