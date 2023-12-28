const express = require('express')

const router = express.Router()

const calendarController = require('../controllers/calendarController')
const controller = new calendarController()

router.post('/create', controller.addEvent)
router.get('/', controller.getEvents)

router.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(500).json({ error: err.message });
});

module.exports = router