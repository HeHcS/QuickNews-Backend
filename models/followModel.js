import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Pre-save middleware to prevent self-following
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    next(new Error('Users cannot follow themselves'));
  }
  next();
});

const Follow = mongoose.model('Follow', followSchema);

export default Follow; 