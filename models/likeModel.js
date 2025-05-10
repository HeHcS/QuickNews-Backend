import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contentType',
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['Video', 'Comment', 'Article']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate likes
likeSchema.index({ user: 1, content: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

export default Like; 