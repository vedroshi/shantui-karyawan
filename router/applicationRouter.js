const express = require('express')

const router = express.Router()

const applicationController = require('../controllers/applicationController')

const controller = new applicationController()

router.post('/:id', controller.applyForm)

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json(err);
});
  

module.exports = router