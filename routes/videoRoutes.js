import express from 'express';
import { 
  streamVideoById, 
  getVideoFeed, 
  getVideoById,
  getCategories,
  bookmarkVideo,
  removeBookmark,
  getUserBookmarks,
  getBookmarkCollections,
  uploadVideo,
  getAllVideos,
  getVideo,
  getCreatorVideos
} from '../controllers/videoController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { handleVideoUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/feed', getVideoFeed);
router.get('/categories', getCategories);
router.get('/creator/:creatorId', getCreatorVideos);
router.get('/:id', getVideo);
router.get('/:id/stream', streamVideoById);
router.get('/', getAllVideos);

// Protected routes (require authentication)
router.post('/:id/bookmark', protect, bookmarkVideo);
router.delete('/:id/bookmark', protect, removeBookmark);
router.get('/user/bookmarks', protect, getUserBookmarks);
router.get('/user/bookmark-collections', protect, getBookmarkCollections);
router.post('/upload', protect, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), handleVideoUploadErrors, uploadVideo);

export default router; 