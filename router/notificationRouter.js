const express = require('express')

const router = express.Router()

const notificationController = require('../controllers/notificationController')

const controller = new notificationController()

router.get('/:page', controller.getNotifications)
router.patch('/read/:id', controller.readNotification)
router.patch('/readall', controller.readAllNotification)

router.post('/create' , controller.addNotification)

router.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(500).json({ error: err.message });
});

module.exports = router
