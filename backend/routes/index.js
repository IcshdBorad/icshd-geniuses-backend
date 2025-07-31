/**
 * Main Routes Index for ICSHD GENIUSES
 * Combines all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const { router: sessionRoutes, setSessionManager } = require('./sessions');
const assessmentRoutes = require('./assessment');

// Import middleware
const { corsMiddleware, createRateLimit } = require('../middleware/auth');

// Apply CORS middleware
router.use(corsMiddleware);

// General rate limiting
const generalRateLimit = createRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes
router.use(generalRateLimit);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ICSHD GENIUSES API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    name: 'ICSHD GENIUSES API',
    description: 'منصة ذكية لتوليد تمارين الحساب الذهني وتقييم الأداء',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    supportedCurricula: ['soroban', 'vedic', 'logic', 'iqgames'],
    features: [
      'Dynamic Exercise Generation',
      'Adaptive Learning',
      'Performance Assessment',
      'Automatic Promotion System',
      'Real-time Session Management',
      'Comprehensive Reporting'
    ],
    endpoints: {
      auth: '/api/auth',
      sessions: '/api/sessions',
      assessment: '/api/assessment'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/assessment', assessmentRoutes);

// Export router and session manager setter
module.exports = {
  router,
  setSessionManager
};
