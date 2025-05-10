import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  getCurrentProfile,
  getProfileById,
  updateProfile,
  uploadProfilePhoto,
  applyForCreator,
  approveCreator,
  rejectCreator,
  manageBadges,
  getProfileByHandle
} from '../controllers/profileController.js';
import { uploadProfilePicture, handleUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/user/:id', getProfileById);

// Protected routes (logged in users)
router.get('/me', protect, getCurrentProfile);
router.put('/', protect, updateProfile);
router.post('/upload-photo', protect, uploadProfilePicture, handleUploadErrors, uploadProfilePhoto);
router.post('/creator-application', protect, applyForCreator);

// Admin only routes
router.put('/:id/approve-creator', protect, restrictTo('admin'), approveCreator);
router.put('/:id/reject-creator', protect, restrictTo('admin'), rejectCreator);
router.put('/:id/badges', protect, restrictTo('admin'), manageBadges);

router.route('/:id')
  .get(getProfileById);

router.route('/handle/:handle')
  .get(getProfileByHandle);

export default router; 