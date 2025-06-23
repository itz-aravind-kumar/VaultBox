const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/fileController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { getUserFiles,generateDownloadLink} = require('../controllers/fileController');
const { deleteFile } = require('../controllers/fileController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/upload', authenticateJWT, upload.single('file'), uploadFile);
router.get('/my-files', authenticateJWT, getUserFiles);
router.get('/download/:filename', authenticateJWT, generateDownloadLink);
router.delete('/delete/:fileId', authenticateJWT, deleteFile);


module.exports = router;
