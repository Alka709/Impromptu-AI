const express = require('express');
const logger = require('./telemetry/logger');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes);

// Frontend Logging Proxy
app.post('/api/logs', (req, res) => {
  const { level, message, ...attributes } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Forward to OTel Logger
  const safeLevel = ['info', 'warn', 'error', 'debug'].includes(level) ? level : 'info';
  logger[safeLevel](message, { source: 'frontend', ...attributes });
  
  res.status(200).json({ status: 'ok' });
});

// Health check
app.get('/health', (req, res) => {
  logger.info("Health endpoint called");
  res.status(200).json({ status: 'ok' });
});

// 404 Not Found middleware
app.use((req, res, next) => {
  logger.warn(`Not Found: ${req.method} ${req.originalUrl}`, { path: req.originalUrl, method: req.method });
  res.status(404).json({ error: 'NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Internal Server Error", { error_message: err.message, stack: err.stack, path: req.originalUrl });
  res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
});

module.exports = app;
