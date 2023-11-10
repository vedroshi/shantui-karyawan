const express = require('express')

const positionController = require('../controllers/positionController')
const router = express.Router()


const controller = new positionController()

router.post('/create', controller.createPosition)


router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});
  
module.exports = router