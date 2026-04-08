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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get enrolled courses with progress (protected)
router.get('/my/enrolled', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'enrolledCourses.course',
        populate: { 
          path: 'instructor', 
          select: 'name email' 
        }
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const courses = user.enrolledCourses.map(ec => {
      const courseData = ec.course ? ec.course.toObject() : {};
      const totalLectures = courseData.lectures?.length || 0;
      const completedCount = ec.completedLectures?.length || 0;
      const progressPercent = totalLectures > 0 
        ? Math.round((completedCount / totalLectures) * 100) 
        : 0;
      
      return {
        ...courseData,
        enrolledAt: ec.enrolledAt,
        progress: progressPercent,
        completedLectures: ec.completedLectures || [],
        lastWatchedLecture: ec.lastWatchedLecture,
        totalLectures,
        completedCount
      };
    }).filter(c => c._id); // Filter out null courses
    
    res.json({ courses });
  } catch (error) {
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error fetching enrolled courses', error: error.message });
  }
});

// Get resume lecture for a course (protected)
router.get('/:id/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled
    const enrolledCourse = user.enrolledCourses.find(
      ec => ec.course.toString() === req.params.id
    );
    
    if (!enrolledCourse) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    const lectures = course.lectures || [];
    if (lectures.length === 0) {
      return res.status(404).json({ message: 'No lectures available' });
    }
    
    // Find next lecture to watch
    let nextLecture = null;
    let nextIndex = 0;
    
    if (enrolledCourse.lastWatchedLecture) {
      const lastIndex = lectures.findIndex(
        l => l._id.toString() === enrolledCourse.lastWatchedLecture.toString()
      );
      if (lastIndex >= 0 && lastIndex < lectures.length - 1) {
        nextIndex = lastIndex + 1;
      } else if (lastIndex >= 0) {
        nextIndex = lastIndex; // Resume from last watched
      }
    }
    
    nextLecture = lectures[nextIndex];
    const completedLectures = enrolledCourse.completedLectures || [];
    
    res.json({
      lecture: nextLecture,
      lectureIndex: nextIndex,
      totalLectures: lectures.length,
      completedLectures: completedLectures.length,
      isCompleted: completedLectures.includes(nextLecture._id.toString()),
      progress: Math.round((completedLectures.length / lectures.length) * 100),
      videoPosition: enrolledCourse.lastVideoPosition || 0
    });
  } catch (error) {
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save video progress (student only)
router.post('/:id/progress', protect, async (req, res) => {
  try {
    const { lectureId, videoPosition } = req.body;
    const courseId = req.params.id;
    
    if (!lectureId || videoPosition === undefined) {
      return res.status(400).json({ message: 'Lecture ID and video position are required' });
    }

    const user = await User.findById(req.userId);
    
    // Find enrolled course
    const enrolledCourse = user.enrolledCourses.find(
      ec => ec.course.toString() === courseId
    );
    
    if (!enrolledCourse) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    // Update last watched info
    enrolledCourse.lastWatchedLecture = lectureId;
    enrolledCourse.lastVideoPosition = Math.floor(videoPosition);
    enrolledCourse.lastWatchedAt = new Date();
    
    await user.save();
    
    res.json({
      message: 'Progress saved',
      lectureId,
      videoPosition: enrolledCourse.lastVideoPosition,
      lastWatchedAt: enrolledCourse.lastWatchedAt
    });
  } catch (error) {
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error saving progress', error: error.message });
  }
});

// Get resume info for a course (protected)
router.get('/:id/resume-info', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is enrolled
    const enrolledCourse = user.enrolledCourses.find(
      ec => ec.course.toString() === req.params.id
    );
    
    if (!enrolledCourse) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    const lectures = course.lectures || [];
    
    // Find the lecture to resume from
    let resumeLecture = null;
    let resumeIndex = 0;
    let videoPosition = 0;
    
    if (enrolledCourse.lastWatchedLecture && lectures.length > 0) {
      const lastIndex = lectures.findIndex(
        l => l._id.toString() === enrolledCourse.lastWatchedLecture.toString()
      );
      
      if (lastIndex >= 0) {
        resumeIndex = lastIndex;
        resumeLecture = lectures[lastIndex];
        videoPosition = enrolledCourse.lastVideoPosition || 0;
      }
    }
    
    // If no last watched, start from first
    if (!resumeLecture && lectures.length > 0) {
      resumeLecture = lectures[0];
      resumeIndex = 0;
      videoPosition = 0;
    }
    
    res.json({
      hasResumeData: !!enrolledCourse.lastWatchedLecture,
      lecture: resumeLecture,
      lectureIndex: resumeIndex,
      videoPosition,
      lastWatchedAt: enrolledCourse.lastWatchedAt,
      progress: enrolledCourse.progress || 0
    });
  } catch (error) {
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get lectures (protected - requires enrollment + approved payment)
router.get('/:id/lectures', protect, checkCourseAccess, async (req, res) => {
  try {
    const course = req.course;
    res.json({ lectures: course.lectures });
  } catch (error) {
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
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
    console.error('Course route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
