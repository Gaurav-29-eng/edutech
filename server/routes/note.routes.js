import express from 'express';
import Note from '../models/note.model.js';
import Course from '../models/course.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all notes for a lecture (protected)
router.get('/:courseId/:lectureId', protect, async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    
    // Verify user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const notes = await Note.find({
      user: req.userId,
      course: courseId,
      lectureId: lectureId
    }).sort({ timestamp: 1, createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error fetching notes', error: error.message });
  }
});

// Get all bookmarks for a user (protected)
router.get('/bookmarks', protect, async (req, res) => {
  try {
    const bookmarks = await Note.find({
      user: req.userId,
      isBookmark: true
    })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });

    res.json({ bookmarks });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error fetching bookmarks', error: error.message });
  }
});

// Create a new note (protected)
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, lectureId, content, timestamp, isBookmark, title } = req.body;

    // Validation
    if (!courseId || !lectureId) {
      return res.status(400).json({ message: 'Course ID and Lecture ID are required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Note content cannot be empty' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ message: 'Note content too long (max 2000 characters)' });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const note = new Note({
      user: req.userId,
      course: courseId,
      lectureId,
      content: content.trim(),
      timestamp: timestamp || 0,
      isBookmark: isBookmark || false,
      title: title ? title.trim() : undefined
    });

    await note.save();

    res.status(201).json({
      message: isBookmark ? 'Bookmark added successfully' : 'Note saved successfully',
      note
    });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error saving note', error: error.message });
  }
});

// Update a note (protected - only owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const { content, timestamp, title } = req.body;
    const noteId = req.params.id;

    // Find note and verify ownership
    const note = await Note.findOne({ _id: noteId, user: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }

    // Validation
    if (content !== undefined) {
      if (content.trim().length === 0) {
        return res.status(400).json({ message: 'Note content cannot be empty' });
      }
      if (content.length > 2000) {
        return res.status(400).json({ message: 'Note content too long (max 2000 characters)' });
      }
      note.content = content.trim();
    }

    if (timestamp !== undefined) {
      note.timestamp = timestamp;
    }

    if (title !== undefined) {
      note.title = title.trim();
    }

    await note.save();

    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error updating note', error: error.message });
  }
});

// Delete a note (protected - only owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await Note.findOneAndDelete({
      _id: noteId,
      user: req.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }

    res.json({
      message: note.isBookmark ? 'Bookmark removed successfully' : 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error deleting note', error: error.message });
  }
});

// Toggle bookmark status
router.patch('/:id/bookmark', protect, async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, user: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found or access denied' });
    }

    note.isBookmark = !note.isBookmark;
    await note.save();

    res.json({
      message: note.isBookmark ? 'Added to bookmarks' : 'Removed from bookmarks',
      note
    });
  } catch (error) {
    console.error('Note route error:', error);
    res.status(500).json({ message: 'Server error updating bookmark', error: error.message });
  }
});

export default router;
