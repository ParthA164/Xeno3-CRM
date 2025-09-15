const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalCustomers:
 *           type: number
 *         totalOrders:
 *           type: number
 *         totalRevenue:
 *           type: number
 *         totalCampaigns:
 *           type: number
 *         customerGrowth:
 *           type: number
 *         orderGrowth:
 *           type: number
 *         revenueGrowth:
 *           type: number
 *         campaignGrowth:
 *           type: number
 *         recentOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         recentCampaigns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Campaign'
 *         monthlyRevenue:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               revenue:
 *                 type: number
 *         customerSegments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               segment:
 *                 type: string
 *               count:
 *                 type: number
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', protect, getDashboardStats);

module.exports = router;
