import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for backward compatibility
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    }],
    lastWatchedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture'
    },
    lastVideoPosition: {
      type: Number,
      default: 0
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  defaultUpiId: {
    type: String,
    default: ''
  },
  // Study streak tracking
  streakCount: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  longestStreak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update study streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!this.lastActiveDate) {
    // First activity ever
    this.streakCount = 1;
    this.lastActiveDate = today;
    this.longestStreak = 1;
    return { message: 'Streak started', streak: 1, isNew: true };
  }
  
  const lastActive = new Date(this.lastActiveDate);
  const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  // Calculate difference in days
  const diffTime = today - lastActiveDay;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Already active today, no change
    return { message: 'Already active today', streak: this.streakCount, isNew: false };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    this.streakCount += 1;
    this.lastActiveDate = today;
    
    // Update longest streak if needed
    if (this.streakCount > this.longestStreak) {
      this.longestStreak = this.streakCount;
    }
    
    return { message: 'Streak continued', streak: this.streakCount, isNew: true };
  } else {
    // Streak broken (more than 1 day gap) - reset to 1
    this.streakCount = 1;
    this.lastActiveDate = today;
    return { message: 'Streak reset', streak: 1, isNew: true, reset: true };
  }
};

const User = mongoose.model('User', userSchema);
export default User;
