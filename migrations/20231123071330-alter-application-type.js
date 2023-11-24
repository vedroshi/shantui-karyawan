'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query('ALTER TABLE karyawan_pengajuan MODIFY Application_Type ENUM("Kompensasi", "Cuti", "Resign", "Return")');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
    */
   await queryInterface.sequelize.query('ALTER TABLE karyawan_pengajuan MODIFY Application_Type ENUM("Kompensasi", "Cuti", "Resign")');
  }
};
