import express from 'express';
import crypto from 'crypto';
import OTP from '../models/otp.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { phone, purpose = 'signup' } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Validate phone format
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    
    // Check if phone already registered for signup
    if (purpose === 'signup') {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
    }
    
    // Check if user exists for login
    if (purpose === 'login') {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: 'No account found with this phone number' });
      }
    }
    
    // Generate and save OTP
    const otp = generateOTP();
    
    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone, purpose });
    
    // Save new OTP
    await OTP.create({
      phone,
      otp,
      purpose,
      attempts: 0
    });
    
    // Send OTP via Twilio if configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (accountSid && authToken && twilioPhone) {
      try {
        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);
        
        await client.messages.create({
          body: `Your EduTech verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioPhone,
          to: phone
        });
        
        console.log(`OTP sent to ${phone}: ${otp}`);
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        // Continue - we'll return OTP in development
      }
    } else {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }
    
    res.json({
      message: 'OTP sent successfully',
      expiresIn: 600, // 10 minutes
      ...(process.env.NODE_ENV === 'development' && { otp }) // Only in development
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp, purpose = 'signup' } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }
    
    // Find OTP record
    const otpRecord = await OTP.findOne({ phone, purpose });
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    
    // Check max attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      return res.status(400).json({
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }
    
    // Delete verified OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    
    res.json({
      message: 'OTP verified successfully',
      verified: true,
      phone
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Resend OTP
router.post('/resend', async (req, res) => {
  try {
    const { phone, purpose = 'signup' } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Check for recent OTP (rate limiting - 30 seconds)
    const recentOTP = await OTP.findOne({
      phone,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 30000) }
    });
    
    if (recentOTP) {
      const waitTime = Math.ceil((recentOTP.createdAt.getTime() + 30000 - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitTime} seconds before requesting a new OTP`
      });
    }
    
    // Delete old OTP and send new
    await OTP.deleteMany({ phone, purpose });
    
    // Generate new OTP
    const otp = generateOTP();
    
    await OTP.create({
      phone,
      otp,
      purpose,
      attempts: 0
    });
    
    // Send via Twilio if configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (accountSid && authToken && twilioPhone) {
      try {
        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);
        
        await client.messages.create({
          body: `Your EduTech verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioPhone,
          to: phone
        });
        
        console.log(`OTP resent to ${phone}: ${otp}`);
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
      }
    } else {
      console.log(`[DEV] Resent OTP for ${phone}: ${otp}`);
    }
    
    res.json({
      message: 'OTP resent successfully',
      expiresIn: 600,
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

export default router;
