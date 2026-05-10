import express from 'express';
import UserProfile from '../models/UserProfile.js';

const router = express.Router();

// GET current user's profile (authenticated)
router.get('/', async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let doc = await UserProfile.findOne({ userId }).lean();
    if (!doc) return res.json({ profile: {} });
    return res.json({ profile: doc.profile });
  } catch (err) {
    console.error('[profile] GET error', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT update current user's profile (authenticated)
router.put('/', async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const incoming = req.body || {};

    const updated = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: { profile: incoming } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    console.debug('[profile] updated', { userId, profileKeys: Object.keys(incoming || {}) });
    res.json({ profile: updated.profile });
  } catch (err) {
    console.error('[profile] PUT error', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
