import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  videoFile: {
    type: String,
    required: [true, 'Video file path is required']
  },
  thumbnail: {
    type: String,
    default: 'default-thumbnail.png'
  },
  duration: {
    type: Number,
    default: 0
  },
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  linkedArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for search functionality
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual field for like status (to be populated by query middleware)
videoSchema.virtual('userLiked').get(function() {
  return this._userLiked || false;
});

videoSchema.virtual('userBookmarked').get(function() {
  return this._userBookmarked || false;
});

const Video = mongoose.model('Video', videoSchema);

export default Video; 