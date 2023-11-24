const express = require('express');
const LogController = require('../controllers/logController');

const router = express.Router()

const controller = new LogController()

router.get('/:id', controller.showLogs)
router.get('/getlast/:id', controller.getLastContract)

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

module.exports = router