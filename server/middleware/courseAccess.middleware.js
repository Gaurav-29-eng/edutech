import Payment from '../models/payment.model.js';
import Course from '../models/course.model.js';

// Check if user has approved payment for the course
export const checkCourseAccess = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Free courses - check if enrolled
    if (course.price === 0) {
      const isEnrolled = course.enrolledStudents.includes(userId);
      if (!isEnrolled) {
        return res.status(403).json({ 
          message: 'You must enroll in this course to access content',
          requiresEnrollment: true
        });
      }
      req.course = course;
      return next();
    }

    // Paid courses - check for approved payment
    const payment = await Payment.findOne({
      user: userId,
      course: courseId,
      status: 'approved'
    });

    if (!payment) {
      // Check if payment is pending
      const pendingPayment = await Payment.findOne({
        user: userId,
        course: courseId,
        status: 'pending'
      });

      if (pendingPayment) {
        return res.status(403).json({
          message: 'Your payment is pending approval. Please wait for admin verification.',
          paymentStatus: 'pending'
        });
      }

      return res.status(403).json({
        message: 'You need to complete payment to access this course content',
        requiresPayment: true,
        price: course.price,
        upiId: course.upiId
      });
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Alternative: Check enrollment only (for basic access)
export const checkEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check enrolled students
    const isEnrolled = course.enrolledStudents.includes(userId);
    
    if (!isEnrolled) {
      return res.status(403).json({ 
        message: 'You must enroll in this course',
        requiresEnrollment: true
      });
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
