const express = require('express')

const router = express.Router()

const applicationController = require('../controllers/applicationController')

const controller = new applicationController()

router.post('/:id', controller.applyForm)
router.patch('/approve/:id', controller.approve)
router.patch('/reject/:id' , controller.reject)
router.patch('/return/:id', controller.setReturn)


router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json(err.message);
});
  

module.exports = router