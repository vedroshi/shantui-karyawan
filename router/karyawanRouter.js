const express = require('express')
const multer = require('multer')
const path = require('path')

const KaryawanController = require('../controllers/karyawanController')
const router = express.Router()

const controller = new KaryawanController()

const storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, `uploads/${process.env.DB_Name}/`)
    },
    filename : (req, file, cb) =>{
        const ext = path.extname(file.originalname);
        cb(null, req.body.NIK + ' - ' + req.body.Name + ext)
    }
})

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, jpeg, and png files are allowed!'), false);
    }
};
  
const upload = multer({storage : storage, fileFilter : fileFilter})



router.get('/' , controller.showKaryawan)
router.post('/create' , upload.single('KTP'), controller.addKaryawan)

router.get('/check', controller.checkApplication)

router.get('/latestupdate', controller.getLatestUpdate)

router.get('/getKTP/:ktp', (req, res)=>{
  const ktp = req.params.ktp;
 
  // Update the path to your KTP images folder
  const filePath = path.join(__dirname, `../uploads/${process.env.DB_NAME}/`, ktp);
  // Send the file
  res.sendFile(filePath);
})

router.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).json({ error: err.message });
});



module.exports = router