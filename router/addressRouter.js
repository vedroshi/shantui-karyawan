const express = require('express')

const router = express.Router()
const addressController = require('../controllers/addressController')

const controller = new addressController()

router.post('/create', controller.createAddress)

module.exports = router