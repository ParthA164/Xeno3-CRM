const express = require('express');
const passport = require('passport');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  getMe,
  googleSuccess,
  googleFailure,
  logout,
  updateProfile,
  getUserStats,
  demoLogin
} = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         avatar:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, user]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', authLimiter, (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=Google OAuth not configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token or error
 */
router.get('/google/callback',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=Google OAuth not configured`);
    }
    passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' })(req, res, next);
  },
  googleSuccess
);

/**
 * @swagger
 * /api/auth/google/success:
 *   get:
 *     summary: Google OAuth success handler
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT token
 */
router.get('/google/success', googleSuccess);

/**
 * @swagger
 * /api/auth/google/failure:
 *   get:
 *     summary: Google OAuth failure handler
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to frontend error page
 */
router.get('/google/failure', googleFailure);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaignCount:
 *                       type: number
 *                     totalMessagesSent:
 *                       type: number
 *                     recentCampaigns:
 *                       type: array
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 */
router.get('/stats', protect, getUserStats);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/demo-login:
 *   post:
 *     summary: Demo login for testing
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Demo login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 */
router.post('/demo-login', authLimiter, demoLogin);

module.exports = router;
