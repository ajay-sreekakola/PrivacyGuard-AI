const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, sector } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, organization, sector });
    const token = signToken(user._id);

    res.status(201).json({ token, user: { id: user._id, name, email, organization, sector, role: user.role, settings: user.settings } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    await AuditLog.create({ userId: user._id, action: 'LOGIN', ipAddress: req.ip, success: true });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email, organization: user.organization, sector: user.sector, role: user.role, settings: user.settings } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Update settings
router.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { settings: req.body.settings }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
