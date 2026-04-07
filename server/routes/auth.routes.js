import express from 'express';
import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Force role to be student for public signup - ignore any role sent
    const user = new User({ name, email, password, role: 'student' });
    await user.save();
    
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin's default UPI ID (admin only)
router.get('/admin/upi', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('defaultUpiId');
    res.json({ defaultUpiId: user.defaultUpiId || '' });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
