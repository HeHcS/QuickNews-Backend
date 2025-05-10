import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Article content is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  summary: {
    type: String,
    maxlength: [500, 'Summary cannot be more than 500 characters']
  },
  featuredImage: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: String,
    trim: true
  }],
  relatedVideo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Add index for search
articleSchema.index({ title: 'text', content: 'text', summary: 'text', tags: 'text' });

const Article = mongoose.model('Article', articleSchema);

export default Article; 