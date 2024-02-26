const express = require('express')
const router = express.Router()
const statusController = require('../controllers/statusController')

const controller = new statusController()

router.patch('/checkexpired', controller.checkExpired)
router.patch('/checkendcuti', controller.checkEndCuti)
router.patch('/warning' , controller.setWarning)

router.post('/setendcuti/:id', controller.setEndCuti)
router.post('/cutoff/:id' , controller.setCutOff)

module.exports = router