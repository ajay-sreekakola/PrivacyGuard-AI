require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/scan',       require('./routes/scan'));
app.use('/api/redact',     require('./routes/redact'));
app.use('/api/audit',      require('./routes/audit'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/policies',   require('./routes/policies'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/embedding',  require('./routes/embedding'));
app.use('/api/nlp',        require('./routes/nlp'));
app.use('/api/settings',   require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/privacyguard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PrivacyGuard AI running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});
