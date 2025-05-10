import express from 'express';
import { 
  uploadArticle,
  getAllArticles,
  getArticle,
  getAuthorArticles,
  updateArticle,
  deleteArticle,
  getCategories,
  getArticleByVideoId
} from '../controllers/articleController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for featured images
const featuredImagesDir = path.join(__dirname, '../uploads/featured-images');
if (!fs.existsSync(featuredImagesDir)) {
  fs.mkdirSync(featuredImagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, featuredImagesDir);
  },
  filename: function(req, file, cb) {
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `featured-image-${userId}-${timestamp}${ext}`);
  }
});

// Add image file filter
const imageFileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer upload for featured images
const uploadFeaturedImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
}).single('featuredImage');

// Middleware to handle upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        status: 'error',
        message: 'Image file size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({ 
      status: 'error',
      message: err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      status: 'error',
      message: err.message 
    });
  }
  next();
};

// Public routes
router.get('/', getAllArticles);
router.get('/categories', getCategories);
router.get('/author/:authorId', getAuthorArticles);
router.get('/video/:videoId', getArticleByVideoId);
router.get('/:id', getArticle);

// Protected routes (require authentication)
router.post('/upload', protect, uploadFeaturedImage, handleUploadErrors, uploadArticle);
router.patch('/:id', protect, uploadFeaturedImage, handleUploadErrors, updateArticle);
router.delete('/:id', protect, deleteArticle);

export default router;