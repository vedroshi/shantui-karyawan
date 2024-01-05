const express = require('express')
const contractController = require('../controllers/contractController')

const controller = new contractController()
const router = express.Router()
const path = require('path')

router.get('/generate/:id', controller.generateContract)
router.get('/download', (req, res)=>{
    const filePath = path.join(__dirname,'../contracts/July 2023/PKWT - BUDI.docx')
    res.setHeader('Content-Transfer-Encoding', 'binary'); // Add this line

    res.sendFile(filePath, (err)=>{
        if(err){
            console.log("Download Failed")
            console.log(err)
        }else{
            console.log("Download Successful")
        }
    })
})
router.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(500).json({ error: err.message });
});


module.exports = router