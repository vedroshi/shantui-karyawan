const express = require('express')
const router = express.Router()
const statusController = require('../controllers/statusController')

const controller = new statusController()

router.patch('/checkexpired', controller.checkExpired)
router.patch('/checkendcuti', controller.checkEndCuti)
router.patch('/warning' , controller.setWarning)

router.post('/setendcuti/:id', controller.setEndCuti)
router.post('/cutoff/:id' , controller.setCutOff)
router.post('/resign/:id', controller.setResign)

router.patch('/check' , controller.checkDue)


router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});
  
module.exports = router