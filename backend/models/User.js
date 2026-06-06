const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  organization: { type: String, default: '' },
  sector: { type: String, enum: ['healthcare', 'finance', 'defense', 'legal', 'general'], default: 'general' },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
  apiKey: { type: String, unique: true, sparse: true },
  settings: {
    sensitivityLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    autoRedact: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
