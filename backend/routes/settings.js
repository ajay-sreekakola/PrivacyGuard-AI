const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Scan = require('../models/Scan');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// Get full profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const scanCount = await Scan.countDocuments({ userId: req.user._id });
    res.json({ user, scanCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const allowed = ['name', 'organization', 'sector', 'settings'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    await AuditLog.create({ userId: req.user._id, action: 'PROFILE_UPDATE', ipAddress: req.ip });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ error: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    await AuditLog.create({ userId: req.user._id, action: 'PASSWORD_CHANGE', ipAddress: req.ip });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate API key
router.post('/api-key', authMiddleware, async (req, res) => {
  try {
    const apiKey = 'pg_' + crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(req.user._id, { apiKey });
    await AuditLog.create({ userId: req.user._id, action: 'API_KEY_GENERATED', ipAddress: req.ip });
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke API key
router.delete('/api-key', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { apiKey: '' } });
    res.json({ message: 'API key revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(password))) return res.status(400).json({ error: 'Password incorrect' });

    await Scan.deleteMany({ userId: req.user._id });
    await AuditLog.deleteMany({ userId: req.user._id });
    await User.deleteOne({ _id: req.user._id });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
