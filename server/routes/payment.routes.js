import express from 'express';
import Payment from '../models/payment.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { uploadPaymentScreenshot } from '../config/cloudinary.js';

const router = express.Router();

// Upload payment screenshot and create payment request (student only)
router.post('/', protect, uploadPaymentScreenshot.single('screenshot'), async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already has an approved or pending payment for this course
    const existingPayment = await Payment.findOne({
      user: req.userId,
      course: courseId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingPayment) {
      return res.status(400).json({ 
        message: `You already have a ${existingPayment.status} payment for this course` 
      });
    }

    const payment = new Payment({
      user: req.userId,
      course: courseId,
      screenshotUrl: req.file.path,
      amount: course.price,
      status: 'pending'
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment request submitted successfully. Waiting for admin approval.',
      payment
    });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payment requests (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .populate('course', 'title price')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my payments (student)
router.get('/my', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId })
      .populate('course', 'title price thumbnail')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check payment status for a course (student)
router.get('/status/:courseId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      user: req.userId,
      course: req.params.courseId
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.json({ status: 'not_paid', message: 'No payment found' });
    }

    res.json({ 
      status: payment.status, 
      payment,
      message: payment.status === 'approved' 
        ? 'Payment approved. You can access the course.' 
        : payment.status === 'pending'
        ? 'Payment pending admin approval.'
        : 'Payment rejected. Please submit a new payment.'
    });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve payment (admin only)
router.put('/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}` });
    }

    payment.status = 'approved';
    payment.reviewedBy = req.userId;
    payment.reviewedAt = new Date();
    await payment.save();

    // Enroll user in course
    const course = await Course.findById(payment.course);
    if (course && !course.enrolledStudents.includes(payment.user)) {
      course.enrolledStudents.push(payment.user);
      await course.save();
    }

    // Add to user's enrolled courses
    const user = await User.findById(payment.user);
    const alreadyEnrolled = user.enrolledCourses.some(
      ec => ec.course.toString() === payment.course.toString()
    );
    
    if (!alreadyEnrolled) {
      user.enrolledCourses.push({
        course: payment.course,
        enrolledAt: new Date(),
        progress: 0,
        completedLectures: [],
        lastWatchedLecture: null
      });
      await user.save();
    }

    res.json({ message: 'Payment approved and student enrolled', payment });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject payment (admin only)
router.put('/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment is already ${payment.status}` });
    }

    payment.status = 'rejected';
    payment.reviewedBy = req.userId;
    payment.reviewedAt = new Date();
    payment.rejectionReason = reason || 'No reason provided';
    await payment.save();

    res.json({ message: 'Payment rejected', payment });
  } catch (error) {
    console.error('Payment route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
