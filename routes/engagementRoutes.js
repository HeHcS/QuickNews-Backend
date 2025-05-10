import express from 'express';
import {
  toggleLike,
  createComment,
  updateComment,
  deleteComment,
  getComments,
  toggleFollow,
  getFollowers,
  getFollowing
} from '../controllers/engagementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Like routes
router.post('/likes/toggle', protect, toggleLike);

// Comment routes
router.post('/comments', protect, createComment);
router.put('/comments/:commentId', protect, updateComment);
router.delete('/comments/:commentId', protect, deleteComment);
router.get('/comments', getComments);

// Follow routes
router.post('/follow/:targetUserId', protect, toggleFollow);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

export default router; 