import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Login - Only registered admins can login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Email not registered' });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current admin (protected)
router.get('/me', authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    res.json({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /auth/forgot - Non-revealing password reset response
router.post('/forgot', async (req, res) => {
  try {
    const { email, lang } = req.body || {};
    // Determine language from body or Accept-Language header; default to English
    let useLang = 'en';
    if (lang && String(lang).toLowerCase().startsWith('ar')) useLang = 'ar';
    else {
      const al = (req.headers['accept-language'] || '').toString();
      if (al.toLowerCase().startsWith('ar')) useLang = 'ar';
    }

    // IMPORTANT: Do NOT reveal whether the email exists. This endpoint always returns a neutral message.
    const msgAR = 'إذا كان لديك حساب مسجل لدينا، سيتم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط إعادة تعيين كلمة المرور.';
    const msgEN = 'If you have a registered account, a password reset link will be sent to your email.';

    // (Optional) internal lookup/send could be implemented here, but must not affect the response.
    // We intentionally avoid returning any hint on existence.

    res.json({ message: useLang === 'ar' ? msgAR : msgEN });
  } catch (err) {
    console.error('[auth] forgot error', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

export default router;

