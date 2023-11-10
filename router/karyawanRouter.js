const express = require('express')
const multer = require('multer')
const path = require('path')

const KaryawanController = require('../controllers/karyawanController')
const router = express.Router()

const controller = new KaryawanController()

const storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, 'uploads/')
    },
    filename : (req, file, cb) =>{
        const ext = path.extname(file.originalname);
        cb(null, req.body.Name + ext)
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

router.post('/create' , upload.single('KTP'), controller.addKaryawan)


module.exports = router