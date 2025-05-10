import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: [true, 'Video is required']
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot be more than 200 characters']
  },
  collectionName: {
    type: String,
    default: 'Default',
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a user can bookmark a video only once
bookmarkSchema.index({ user: 1, video: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark; 