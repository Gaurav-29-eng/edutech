import express from 'express';
import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }
    
    // Validate field types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid field types' });
    }
    
    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Force role to be student for public signup - ignore any role sent
    const user = new User({ 
      name: trimmedName, 
      email: trimmedEmail, 
      password, 
      role: 'student' 
    });
    await user.save();
    
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }
    
    // Validate field types
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid field types' });
    }
    
    const trimmedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id, user.role);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/admin-only', protect, adminOnly, (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Get all users (admin only)
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user (admin only)
router.post('/create-admin', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const user = new User({ name, email, password, role: 'admin' });
    await user.save();
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only, cannot delete self)
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userIdToDelete === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password (any logged-in user)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin's default UPI ID (admin only)
router.get('/admin/upi', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('defaultUpiId');
    res.json({ defaultUpiId: user.defaultUpiId || '' });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update admin's default UPI ID (admin only)
router.put('/admin/upi', protect, adminOnly, async (req, res) => {
  try {
    const { defaultUpiId } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { defaultUpiId: defaultUpiId || '' },
      { new: true }
    ).select('defaultUpiId');
    
    res.json({ 
      message: 'Default UPI ID updated successfully',
      defaultUpiId: user.defaultUpiId 
    });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin dashboard stats (admin only)
router.get('/admin/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const Course = (await import('../models/course.model.js')).default;
    const Payment = (await import('../models/payment.model.js')).default;
    
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $count: 'total' }
    ]).then(result => result[0]?.total || 0);
    
    // Get pending payments count
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    
    // Get recent users (last 10)
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        pendingPayments
      },
      recentUsers
    });
  } catch (error) {
    console.error('Auth route error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats', error: error.message });
  }
});

export default router;
