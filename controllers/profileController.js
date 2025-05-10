import User from '../models/userModel.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Get current user profile
 * @route   GET /api/profile
 * @access  Private
 */
export const getCurrentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @desc    Get user profile by ID
 * @route   GET /api/profile/:id
 * @access  Public
 */
export const getProfileById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await User.findById(req.params.id).select('-resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @desc    Get user profile by handle
 * @route   GET /api/profile/handle/:handle
 * @access  Public
 */
export const getProfileByHandle = catchAsync(async (req, res, next) => {
  const profile = await User.findOne({ handle: req.params.handle })
    .select('-password -refreshToken -passwordChangedAt -passwordResetToken -passwordResetExpires');

  if (!profile) {
    return next(new AppError('No profile found with that handle', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      profile
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      website,
      location,
      phone,
      socialLinks
    } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (website) user.website = website;
    if (location) user.location = location;
    if (phone) user.phone = phone;
    
    // Update social links if provided
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks
      };
    }
    
    // Save updated user
    await user.save();
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/profile/upload-photo
 * @access  Private
 */
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete old profile picture if it's not the default one
    if (user.profilePicture !== 'default-profile.png') {
      const oldPicturePath = path.join(__dirname, '../uploads/profiles', user.profilePicture);
      
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }
    
    // Update profile picture path in user document
    user.profilePicture = req.file.filename;
    await user.save();
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Apply for creator status
 * @route   POST /api/profile/creator-application
 * @access  Private
 */
export const applyForCreator = async (req, res) => {
  try {
    const { category, specialization } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already a creator
    if (user.role === 'creator' && user.creatorProfile?.isApproved) {
      return res.status(400).json({ error: 'User is already an approved creator' });
    }
    
    // Initialize or update creator profile
    user.creatorProfile = {
      ...user.creatorProfile,
      isApproved: false,
      category,
      specialization: specialization || [],
      applicationDate: new Date()
    };
    
    await user.save();
    
    res.status(200).json({
      message: 'Creator application submitted successfully',
      applicationDate: user.creatorProfile.applicationDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Approve creator application (Admin only)
 * @route   PUT /api/profile/:id/approve-creator
 * @access  Private/Admin
 */
export const approveCreator = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has applied for creator status
    if (!user.creatorProfile || !user.creatorProfile.applicationDate) {
      return res.status(400).json({ error: 'User has not applied for creator status' });
    }
    
    // Update user to creator status
    user.role = 'creator';
    user.creatorProfile.isApproved = true;
    user.creatorProfile.approvalDate = new Date();
    
    // Add verified badge if specified
    if (req.body.verifiedBadge) {
      if (!user.creatorProfile.badges) {
        user.creatorProfile.badges = [];
      }
      if (!user.creatorProfile.badges.includes('verified')) {
        user.creatorProfile.badges.push('verified');
      }
    }
    
    await user.save();
    
    res.status(200).json({
      message: 'Creator status approved',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        creatorProfile: user.creatorProfile
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Reject creator application (Admin only)
 * @route   PUT /api/profile/:id/reject-creator
 * @access  Private/Admin
 */
export const rejectCreator = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has applied for creator status
    if (!user.creatorProfile || !user.creatorProfile.applicationDate) {
      return res.status(400).json({ error: 'User has not applied for creator status' });
    }
    
    user.creatorProfile.isApproved = false;
    user.creatorProfile.rejectionReason = reason;
    
    await user.save();
    
    res.status(200).json({
      message: 'Creator application rejected',
      reason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Manage creator badges (Admin only)
 * @route   PUT /api/profile/:id/badges
 * @access  Private/Admin
 */
export const manageBadges = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { action, badges } = req.body;
    
    if (!action || !badges || !Array.isArray(badges)) {
      return res.status(400).json({ 
        error: 'Invalid request. Provide action (add/remove) and badges array' 
      });
    }
    
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either add or remove' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is a creator
    if (user.role !== 'creator') {
      return res.status(400).json({ error: 'User is not a creator' });
    }
    
    // Initialize badges array if it doesn't exist
    if (!user.creatorProfile.badges) {
      user.creatorProfile.badges = [];
    }
    
    // Filter out invalid badges
    const validBadges = badges.filter(badge => 
      ['verified', 'trending', 'top-creator', 'rising-star'].includes(badge)
    );
    
    if (action === 'add') {
      // Add badges not already present
      validBadges.forEach(badge => {
        if (!user.creatorProfile.badges.includes(badge)) {
          user.creatorProfile.badges.push(badge);
        }
      });
    } else if (action === 'remove') {
      // Remove specified badges
      user.creatorProfile.badges = user.creatorProfile.badges.filter(
        badge => !validBadges.includes(badge)
      );
    }
    
    await user.save();
    
    res.status(200).json({
      message: `Badges ${action === 'add' ? 'added to' : 'removed from'} creator profile`,
      badges: user.creatorProfile.badges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 