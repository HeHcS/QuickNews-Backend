import Article from '../models/articleModel.js';
import mongoose from 'mongoose';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/redisCache.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the articles directory
const ARTICLES_DIR = path.join(__dirname, '../uploads/articles');
const FEATURED_IMAGES_DIR = path.join(__dirname, '../uploads/featured-images');

// Ensure directories exist
if (!fs.existsSync(ARTICLES_DIR)) {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
}

if (!fs.existsSync(FEATURED_IMAGES_DIR)) {
  fs.mkdirSync(FEATURED_IMAGES_DIR, { recursive: true });
}

// Cache keys
const CACHE_KEYS = {
  ARTICLES: 'articles:',
  ARTICLE: 'article:',
  CATEGORIES: 'article-categories:'
};

/**
 * Upload a new article with optional featured image
 * @route POST /api/articles/upload
 * @access Private
 */
export const uploadArticle = catchAsync(async (req, res, next) => {
  // Check if article data is provided
  if (!req.body.title || !req.body.content) {
    return next(new AppError('Please provide title and content for the article', 400));
  }

  // Create article object
  const articleData = {
    title: req.body.title,
    content: req.body.content,
    author: req.user.id,
    summary: req.body.summary,
    tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    categories: req.body.categories ? JSON.parse(req.body.categories) : [],
    status: req.body.status || 'draft',
    isPublished: req.body.status === 'published'
  };

  // If related video is provided, add it
  if (req.body.relatedVideo) {
    articleData.relatedVideo = req.body.relatedVideo;
  }

  // If featured image was uploaded, add the path
  if (req.file) {
    articleData.featuredImage = req.file.filename;
  }

  // Create the article
  const article = await Article.create(articleData);

  // Clear relevant caches
  await clearCacheByPattern(`${CACHE_KEYS.ARTICLES}*`);
  
  res.status(201).json({
    status: 'success',
    data: {
      article
    }
  });
});

/**
 * Get all articles with pagination
 * @route GET /api/articles
 * @access Public
 */
export const getAllArticles = catchAsync(async (req, res, next) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  
  // Get category from query params
  const category = req.query.category;
  const tag = req.query.tag;
  
  // Create a cache key based on the request parameters
  const cacheKey = `${CACHE_KEYS.ARTICLES}${page}:${limit}:${category || 'all'}:${tag || 'all'}`;
  
  // Try to get cached articles data
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }
  
  // Build query
  const query = { status: 'published' };
  
  if (category) {
    query.categories = { $in: [category] };
  }
  
  if (tag) {
    query.tags = { $in: [tag] };
  }
  
  // Execute query with pagination
  const articles = await Article.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name username profilePicture')
    .lean();
  
  // Get total count for pagination
  const total = await Article.countDocuments(query);
  
  const result = {
    status: 'success',
    data: {
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  };
  
  // Cache the result
  await setCache(cacheKey, result, 3600); // Cache for 1 hour
  
  res.json(result);
});

/**
 * Get a single article by ID
 * @route GET /api/articles/:id
 * @access Public
 */
export const getArticle = catchAsync(async (req, res, next) => {
  // Validate if ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid article ID format', 400));
  }
  
  // Create cache key
  const cacheKey = `${CACHE_KEYS.ARTICLE}${req.params.id}`;
  
  // Try to get cached article
  const cachedArticle = await getCache(cacheKey);
  if (cachedArticle) {
    return res.json(cachedArticle);
  }
  
  // Find article
  const article = await Article.findById(req.params.id)
    .populate('author', 'name username profilePicture')
    .populate('relatedVideo', 'title thumbnail videoFile');
  
  if (!article) {
    return next(new AppError('Article not found', 404));
  }
  
  // If article is not published and user is not the author, return error
  if (article.status !== 'published' && 
      (!req.user || req.user.id !== article.author._id.toString())) {
    return next(new AppError('This article is not available', 403));
  }
  
  // Increment view count
  article.viewCount += 1;
  await article.save({ validateBeforeSave: false });
  
  const result = {
    status: 'success',
    data: {
      article
    }
  };
  
  // Cache the result
  await setCache(cacheKey, result, 3600); // Cache for 1 hour
  
  res.json(result);
});

/**
 * Get articles by author
 * @route GET /api/articles/author/:authorId
 * @access Public
 */
export const getAuthorArticles = catchAsync(async (req, res, next) => {
  // Validate if author ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.authorId)) {
    return next(new AppError('Invalid author ID format', 400));
  }
  
  // Parse pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  
  // Build query
  const query = { 
    author: req.params.authorId,
    status: 'published'
  };
  
  // If the user is the author, show all articles including drafts
  if (req.user && req.user.id === req.params.authorId) {
    delete query.status;
  }
  
  // Execute query
  const articles = await Article.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name username profilePicture')
    .lean();
  
  // Get total count
  const total = await Article.countDocuments(query);
  
  res.json({
    status: 'success',
    data: {
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Update an article
 * @route PATCH /api/articles/:id
 * @access Private
 */
export const updateArticle = catchAsync(async (req, res, next) => {
  // Validate if ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid article ID format', 400));
  }
  
  // Find the article
  const article = await Article.findById(req.params.id);
  
  if (!article) {
    return next(new AppError('Article not found', 404));
  }
  
  // Check if user is the author
  if (article.author.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this article', 403));
  }
  
  // Update fields
  const updateData = {};
  
  if (req.body.title) updateData.title = req.body.title;
  if (req.body.content) updateData.content = req.body.content;
  if (req.body.summary) updateData.summary = req.body.summary;
  if (req.body.tags) updateData.tags = JSON.parse(req.body.tags);
  if (req.body.categories) updateData.categories = JSON.parse(req.body.categories);
  if (req.body.status) {
    updateData.status = req.body.status;
    updateData.isPublished = req.body.status === 'published';
  }
  if (req.body.relatedVideo) updateData.relatedVideo = req.body.relatedVideo;
  
  // If new featured image was uploaded
  if (req.file) {
    // Delete old featured image if exists
    if (article.featuredImage) {
      const oldImagePath = path.join(FEATURED_IMAGES_DIR, article.featuredImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    updateData.featuredImage = req.file.filename;
  }
  
  // Update the article
  const updatedArticle = await Article.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('author', 'name username profilePicture');
  
  // Clear relevant caches
  await deleteCache(`${CACHE_KEYS.ARTICLE}${req.params.id}`);
  await clearCacheByPattern(`${CACHE_KEYS.ARTICLES}*`);
  
  res.json({
    status: 'success',
    data: {
      article: updatedArticle
    }
  });
});

/**
 * Delete an article
 * @route DELETE /api/articles/:id
 * @access Private
 */
export const deleteArticle = catchAsync(async (req, res, next) => {
  // Validate if ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid article ID format', 400));
  }
  
  // Find the article
  const article = await Article.findById(req.params.id);
  
  if (!article) {
    return next(new AppError('Article not found', 404));
  }
  
  // Check if user is the author
  if (article.author.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to delete this article', 403));
  }
  
  // Delete featured image if exists
  if (article.featuredImage) {
    const imagePath = path.join(FEATURED_IMAGES_DIR, article.featuredImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  // Delete the article
  await Article.findByIdAndDelete(req.params.id);
  
  // Clear relevant caches
  await deleteCache(`${CACHE_KEYS.ARTICLE}${req.params.id}`);
  await clearCacheByPattern(`${CACHE_KEYS.ARTICLES}*`);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Get article categories
 * @route GET /api/articles/categories
 * @access Public
 */
export const getCategories = catchAsync(async (req, res, next) => {
  // Try to get cached categories
  const cacheKey = CACHE_KEYS.CATEGORIES;
  const cachedCategories = await getCache(cacheKey);
  
  if (cachedCategories) {
    return res.json(cachedCategories);
  }
  
  // Aggregate to get unique categories and their counts
  const categories = await Article.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const result = {
    status: 'success',
    data: {
      categories: categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    }
  };
  
  // Cache the result
  await setCache(cacheKey, result, 3600); // Cache for 1 hour
  
  res.json(result);
});

// New function to get an article by related video ID
export const getArticleByVideoId = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    // Find article where the relatedVideo field matches the videoId
    const article = await Article.findOne({ relatedVideo: videoId })
                                 .populate('author', 'name profilePicture');

    if (!article) {
      return res.status(404).json({
        status: 'error',
        message: 'No article found for this video'
      });
    }

    res.status(200).json({
      status: 'success',
      article
    });
  } catch (error) {
    console.error('Error fetching article by video ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching article'
    });
  }
};