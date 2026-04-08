import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lectureId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Number,
    default: 0
  },
  isBookmark: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ user: 1, course: 1, lectureId: 1 });
noteSchema.index({ user: 1, isBookmark: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;
