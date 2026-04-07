import express from 'express';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { checkCourseAccess } from '../middleware/courseAccess.middleware.js';
import { uploadVideo, uploadNotes, uploadThumbnail } from '../config/cloudinary.js';

const router = express.Router();

// Generate UPI payment link
const generateUpiLink = (upiId, amount) => {
  if (!upiId || !amount) return null;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=EduTech&am=${amount}&cu=INR`;
};

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name email')
      .select('-lectures.videoUrl -lectures.notesUrl');
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single course (public) - includes UPI link, excludes lecture video URLs
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .select('-lectures.videoUrl -lectures.notesUrl');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Generate UPI link
    const upiLink = generateUpiLink(course.upiId, course.price);
    
    res.json({ 
      course: {
        ...course.toObject(),
        upiLink
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create course with thumbnail upload (admin only)
router.post('/', protect, adminOnly, uploadThumbnail.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, price, upiId, lectures } = req.body;
    
    // If no UPI ID provided, use admin's default UPI
    let finalUpiId = upiId;
    if (!finalUpiId || finalUpiId.trim() === '') {
      const admin = await User.findById(req.userId).select('defaultUpiId');
      finalUpiId = admin.defaultUpiId || '';
    }
    
    const course = new Course({
      title,
      description,
      thumbnail: req.file ? req.file.path : '',
      upiId: finalUpiId,
      price,
      instructor: req.userId,
      lectures: lectures || []
    });
    
    await course.save();
    await course.populate('instructor', 'name email');
    
    const upiLink = generateUpiLink(course.upiId, course.price);
    
    res.status(201).json({
      message: 'Course created successfully',
      course: {
        ...course.toObject(),
        upiLink
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add lecture with YouTube URL and optional notes (admin only)
router.post('/:id/lectures', protect, adminOnly, uploadNotes.single('notes'), async (req, res) => {
  try {
    const { title, videoUrl, duration } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Validate YouTube URL
    if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      return res.status(400).json({ message: 'Valid YouTube URL is required' });
    }
    
    const lecture = {
      title,
      videoUrl: videoUrl,
      notesUrl: req.file ? req.file.path : req.body.notesUrl || '',
      duration: duration || 0
    };
    
    course.lectures.push(lecture);
    await course.save();
    
    res.status(201).json({
      message: 'Lecture added successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Enroll in course (protected)
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled in course
    if (course.enrolledStudents.includes(req.userId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Add user to course's enrolledStudents
    course.enrolledStudents.push(req.userId);
    await course.save();
    
    // Add course to user's enrolledCourses
    const user = await User.findById(req.userId);
    const alreadyEnrolled = user.enrolledCourses.some(
      ec => ec.course.toString() === req.params.id
    );
    
    if (!alreadyEnrolled) {
      user.enrolledCourses.push({
        course: req.params.id,
        enrolledAt: new Date(),
        progress: 0,
        completedLectures: [],
        lastWatchedLecture: null
      });
      await user.save();
    }
    
    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get enrolled courses with progress (protected)
router.get('/my/enrolled', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses.course',
        populate: { path: 'instructor', select: 'name email' }
      });
    
    const courses = user.enrolledCourses.map(ec => ({
      ...ec.course.toObject(),
      enrolledAt: ec.enrolledAt,
      progress: ec.progress,
      completedLectures: ec.completedLectures,
      lastWatchedLecture: ec.lastWatchedLecture
    }));
    
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course (admin only)
router.put('/:id', protect, adminOnly, uploadThumbnail.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, price, upiId, isPublished } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (price !== undefined) course.price = price;
    if (upiId !== undefined) course.upiId = upiId;
    if (isPublished !== undefined) course.isPublished = isPublished;
    
    // Update thumbnail if provided
    if (req.file) course.thumbnail = req.file.path;
    
    await course.save();
    await course.populate('instructor', 'name email');
    
    const upiLink = generateUpiLink(course.upiId, course.price);
    
    res.json({
      message: 'Course updated successfully',
      course: {
        ...course.toObject(),
        upiLink
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update lecture (admin only)
router.put('/:id/lectures/:lectureId', protect, adminOnly, uploadNotes.single('notes'), async (req, res) => {
  try {
    const { title, videoUrl, duration } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const lecture = course.lectures.id(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    // Update fields
    if (title) lecture.title = title;
    if (videoUrl) lecture.videoUrl = videoUrl;
    if (duration) lecture.duration = duration;
    if (req.file) lecture.notesUrl = req.file.path;
    
    await course.save();
    
    res.json({
      message: 'Lecture updated successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete lecture (admin only)
router.delete('/:id/lectures/:lectureId', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const lectureIndex = course.lectures.findIndex(
      l => l._id.toString() === req.params.lectureId
    );
    
    if (lectureIndex === -1) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    course.lectures.splice(lectureIndex, 1);
    await course.save();
    
    res.json({
      message: 'Lecture deleted successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get lectures (protected - requires enrollment + approved payment)
router.get('/:id/lectures', protect, checkCourseAccess, async (req, res) => {
  try {
    const course = req.course;
    res.json({ lectures: course.lectures });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single lecture content (protected)
router.get('/:id/lectures/:lectureId', protect, checkCourseAccess, async (req, res) => {
  try {
    const course = req.course;
    const lecture = course.lectures.id(req.params.lectureId);
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    
    res.json({ lecture });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check course access status for current user (protected)
router.get('/:id/access', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const userId = req.userId;
    const isEnrolled = course.enrolledStudents.includes(userId);
    
    // Check payment status
    const Payment = (await import('../models/payment.model.js')).default;
    const payment = await Payment.findOne({
      user: userId,
      course: req.params.id,
      status: 'approved'
    });

    res.json({
      hasAccess: isEnrolled || !!payment,
      isEnrolled,
      paymentStatus: payment ? 'approved' : isEnrolled ? 'enrolled' : 'none',
      course: {
        title: course.title,
        price: course.price,
        upiId: course.upiId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
