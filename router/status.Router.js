const express = require('express')
const router = express.Router()
const statusController = require('../controllers/statusController')
const { route } = require('./applicationRouter')

const controller = new statusController()

router.post('/setendcuti/:id', controller.setEndCuti)

module.exports = router