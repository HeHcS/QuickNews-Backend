import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  handle: {
    type: String,
    required: [true, 'Handle is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]{3,30}$/, 'Handle can only contain letters, numbers, and underscores, and must be between 3-30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.appleId; // Not required if using OAuth
    },
    minlength: [8, 'Password must be at least 8 characters']
  },
  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    youtube: String,
    tiktok: String,
    linkedin: String,
    facebook: String
  },
  role: {
    type: String,
    enum: ['user', 'creator', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Creator-specific fields
  creatorProfile: {
    isApproved: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      trim: true
    },
    badges: [{
      type: String,
      enum: ['verified', 'trending', 'top-creator', 'rising-star']
    }],
    specialization: [String],
    applicationDate: Date,
    approvalDate: Date,
    rejectionReason: String,
    featured: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    followers: {
      type: Number,
      default: 0
    },
    following: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    }
  },
  googleId: String,
  appleId: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Don't return password in queries
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

export default User; 