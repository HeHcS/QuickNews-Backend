import Like from '../models/likeModel.js';
import Comment from '../models/commentModel.js';
import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';
import Article from '../models/articleModel.js';
import { createError } from '../utils/errorMessage.js';
import mongoose from 'mongoose';

// Like Controllers
export const toggleLike = async (req, res, next) => {
  try {
    const { contentId, contentType } = req.body;
    const userId = req.user._id;

    // Validate that the content exists
    let contentExists = false;
    
    if (contentType === 'Video') {
      contentExists = await Video.exists({ _id: contentId });
    } else if (contentType === 'Article') {
      contentExists = await Article.exists({ _id: contentId });
    } else if (contentType === 'Comment') {
      contentExists = await Comment.exists({ _id: contentId });
    }
    
    if (!contentExists) {
      return next(createError(404, `${contentType} not found`));
    }

    const existingLike = await Like.findOne({
      user: userId,
      content: contentId,
      contentType
    });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      // Emit socket event for unlike
      if (req.io) {
        req.io.emit(`like:${contentId}`, {
          type: 'unlike',
          userId,
          contentId
        });
      }
      return res.status(200).json({ message: 'Like removed successfully' });
    }

    const newLike = await Like.create({
      user: userId,
      content: contentId,
      contentType
    });

    // Emit socket event for new like
    if (req.io) {
      req.io.emit(`like:${contentId}`, {
        type: 'like',
        userId,
        contentId
      });
    }

    res.status(201).json(newLike);
  } catch (error) {
    next(createError(500, error.message));
  }
};

// Comment Controllers
export const createComment = async (req, res, next) => {
  try {
    const { contentId, contentType, text, parentComment } = req.body;
    const userId = req.user._id;

    // Validate that the content exists
    let contentExists = false;
    
    if (contentType === 'Video') {
      contentExists = await Video.exists({ _id: contentId });
    } else if (contentType === 'Article') {
      contentExists = await Article.exists({ _id: contentId });
    }
    
    if (!contentExists) {
      return next(createError(404, `${contentType} not found`));
    }

    // If this is a reply, check if parent comment exists
    if (parentComment) {
      const commentExists = await Comment.exists({ _id: parentComment });
      if (!commentExists) {
        return next(createError(404, 'Parent comment not found'));
      }
    }

    const comment = await Comment.create({
      user: userId,
      content: contentId,
      contentType,
      text,
      parentComment
    });

    // If this is a reply, increment the parent comment's repliesCount
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $inc: { repliesCount: 1 }
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name profilePicture');

    // Emit socket event for new comment
    if (req.io) {
      req.io.emit(`comment:${contentId}`, {
        type: 'new',
        comment: populatedComment
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    next(createError(500, error.message));
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(createError(404, 'Comment not found'));
    }

    if (comment.user.toString() !== userId.toString()) {
      return next(createError(403, 'Not authorized to update this comment'));
    }

    comment.text = text;
    comment.isEdited = true;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name profilePicture');

    // Emit socket event for updated comment
    req.io.emit(`comment:${comment.content}`, {
      type: 'update',
      comment: populatedComment
    });

    res.status(200).json(populatedComment);
  } catch (error) {
    next(createError(500, error.message));
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(createError(404, 'Comment not found'));
    }

    if (comment.user.toString() !== userId.toString()) {
      return next(createError(403, 'Not authorized to delete this comment'));
    }

    // If this is a reply, decrement the parent comment's repliesCount
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { repliesCount: -1 }
      });
    }

    await comment.deleteOne();

    // Emit socket event for deleted comment
    req.io.emit(`comment:${comment.content}`, {
      type: 'delete',
      commentId
    });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(createError(500, error.message));
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { contentId, contentType, parentComment = null } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      content: contentId,
      contentType,
      parentComment,
      active: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'name profilePicture' }
      });

    const total = await Comment.countDocuments({
      content: contentId,
      contentType,
      parentComment,
      active: true
    });

    res.status(200).json({
      comments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// Follow Controllers
export const toggleFollow = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    if (targetUserId === userId.toString()) {
      return next(createError(400, 'Users cannot follow themselves'));
    }

    // Check if target user exists
    const targetUserExists = await User.exists({ _id: targetUserId });
    if (!targetUserExists) {
      return next(createError(404, 'Target user not found'));
    }

    const existingFollow = await Follow.findOne({
      follower: userId,
      following: targetUserId
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      
      // Update user stats
      await User.updateOne(
        { _id: targetUserId },
        { $inc: { 'stats.followers': -1 } }
      );
      await User.updateOne(
        { _id: userId },
        { $inc: { 'stats.following': -1 } }
      );

      // Emit socket event for unfollow
      if (req.io) {
        req.io.emit(`follow:${targetUserId}`, {
          type: 'unfollow',
          userId,
          targetUserId
        });
      }

      return res.status(200).json({ message: 'Unfollowed successfully' });
    }

    const newFollow = await Follow.create({
      follower: userId,
      following: targetUserId
    });

    // Update user stats
    await User.updateOne(
      { _id: targetUserId },
      { $inc: { 'stats.followers': 1 } }
    );
    await User.updateOne(
      { _id: userId },
      { $inc: { 'stats.following': 1 } }
    );

    // Emit socket event for new follow
    if (req.io) {
      req.io.emit(`follow:${targetUserId}`, {
        type: 'follow',
        userId,
        targetUserId
      });
    }

    res.status(201).json(newFollow);
  } catch (error) {
    next(createError(500, error.message));
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ following: userId, status: 'active' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name profilePicture stats');

    const total = await Follow.countDocuments({
      following: userId,
      status: 'active'
    });

    res.status(200).json({
      followers: followers.map(f => f.follower),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: userId, status: 'active' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', 'name profilePicture stats');

    const total = await Follow.countDocuments({
      follower: userId,
      status: 'active'
    });

    res.status(200).json({
      following: following.map(f => f.following),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(createError(500, error.message));
  }
}; 