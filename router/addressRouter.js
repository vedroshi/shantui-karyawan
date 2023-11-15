const express = require('express')

const router = express.Router()
const addressController = require('../controllers/addressController')

const controller = new addressController()

router.post('/create', controller.createAddress)

router.use((err, req, res, next)=>{
    console.error(err.stack)
    res.status(500).json({ error: err.message })
})

module.exports = router