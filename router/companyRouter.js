const express = require('express')
const router = express.Router()

const companyController = require('../controllers/companyController')

const controller = new companyController()

router.get('/sites', controller.listSites)
router.get('/', controller.listUsers)
router.post('/create', controller.addCompany)

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: err.message });
});
  

module.exports = router