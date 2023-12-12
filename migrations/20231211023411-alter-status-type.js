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
    return queryInterface.sequelize.transaction(async (transaction)=>{
      await queryInterface.sequelize.query(`Alter table status_karyawan Modify column Status enum('Active','Warning','Resign','Cut Off','Cuti','Close Project','On Hold')`,{
        transaction : transaction
      })
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(async (transaction)=>{
      await queryInterface.sequelize.query(`Alter table status_karyawan Modify column Status enum('Active','Warning','Resign','Cut Off','Cuti','Close Project')`,{
        transaction : transaction
      })
    })
  }
};
