const express = require('express');
const { protect } = require('../middleware/auth');
const { campaignLimiter } = require('../middleware/rateLimiter');
const { body } = require('express-validator');
const {
  getCampaigns,
  getCampaign,
  previewAudience,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  pauseCampaign,
  getCampaignAnalytics
} = require('../controllers/campaignController');

const router = express.Router();

// Campaign validation middleware
const validateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Campaign name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['email', 'sms', 'both'])
    .withMessage('Invalid message type'),
  
  body('audienceRules')
    .isArray({ min: 1 })
    .withMessage('Audience rules must be a non-empty array'),
  
  body('audienceRules.*.field')
    .isIn(['totalSpending', 'visits', 'daysSinceLastVisit', 'registrationDate', 'segment', 'isActive', 'tags'])
    .withMessage('Invalid audience rule field'),
  
  body('audienceRules.*.operator')
    .isIn(['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains'])
    .withMessage('Invalid audience rule operator'),
  
  body('audienceRules.*.value')
    .notEmpty()
    .withMessage('Audience rule value is required'),
  
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'sending', 'sent', 'paused', 'completed', 'failed'])
    .withMessage('Invalid campaign status'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date')
];

const validatePreview = [
  body('audienceRules')
    .isArray({ min: 1 })
    .withMessage('Audience rules must be a non-empty array'),
  
  body('audienceRules.*.field')
    .isIn(['totalSpending', 'visits', 'daysSinceLastVisit', 'registrationDate', 'segment', 'isActive', 'tags'])
    .withMessage('Invalid audience rule field'),
  
  body('audienceRules.*.operator')
    .isIn(['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains'])
    .withMessage('Invalid audience rule operator'),
  
  body('audienceRules.*.value')
    .notEmpty()
    .withMessage('Audience rule value is required')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdBy:
 *           type: string
 *         audienceRules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 enum: [totalSpending, visits, daysSinceLastVisit, registrationDate, segment, isActive, tags]
 *               operator:
 *                 type: string
 *                 enum: [">", "<", ">=", "<=", "==", "!=", "contains", "not_contains"]
 *               value:
 *                 type: string
 *               logicalOperator:
 *                 type: string
 *                 enum: [AND, OR]
 *         naturalLanguageQuery:
 *           type: string
 *         audienceSize:
 *           type: number
 *         message:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [email, sms, both]
 *         status:
 *           type: string
 *           enum: [draft, scheduled, sending, sent, paused, completed, failed]
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         sentAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         stats:
 *           type: object
 *           properties:
 *             totalSent:
 *               type: number
 *             totalFailed:
 *               type: number
 *             totalDelivered:
 *               type: number
 *             deliveryRate:
 *               type: number
 *         aiSuggestions:
 *           type: object
 *           properties:
 *             messageVariants:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   tone:
 *                     type: string
 *                   score:
 *                     type: number
 *             audienceInsights:
 *               type: string
 *             performancePrediction:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns with pagination and filtering
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sending, sent, paused, completed, failed]
 *         description: Filter by campaign status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - message
 *               - audienceRules
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               message:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [email, sms, both]
 *               audienceRules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - field
 *                     - operator
 *                     - value
 *                   properties:
 *                     field:
 *                       type: string
 *                       enum: [totalSpending, visits, daysSinceLastVisit, registrationDate, segment, isActive, tags]
 *                     operator:
 *                       type: string
 *                       enum: [">", "<", ">=", "<=", "==", "!=", "contains", "not_contains"]
 *                     value:
 *                       type: string
 *                     logicalOperator:
 *                       type: string
 *                       enum: [AND, OR]
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, sending]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Validation error
 */
router.route('/')
  .get(protect, getCampaigns)
  .post(protect, campaignLimiter, validateCampaign, createCampaign);

/**
 * @swagger
 * /api/campaigns/preview:
 *   post:
 *     summary: Preview audience size for campaign rules
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - audienceRules
 *             properties:
 *               audienceRules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - field
 *                     - operator
 *                     - value
 *                   properties:
 *                     field:
 *                       type: string
 *                       enum: [totalSpending, visits, daysSinceLastVisit, registrationDate, segment, isActive, tags]
 *                     operator:
 *                       type: string
 *                       enum: [">", "<", ">=", "<=", "==", "!=", "contains", "not_contains"]
 *                     value:
 *                       type: string
 *                     logicalOperator:
 *                       type: string
 *                       enum: [AND, OR]
 *     responses:
 *       200:
 *         description: Audience preview retrieved successfully
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
 *                     audienceSize:
 *                       type: number
 *                     sampleCustomers:
 *                       type: array
 *                     estimatedCost:
 *                       type: number
 *                     estimatedDeliveryTime:
 *                       type: number
 *       400:
 *         description: Validation error
 */
router.post('/preview', protect, validatePreview, previewAudience);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get a single campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 *   put:
 *     summary: Update a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       404:
 *         description: Campaign not found
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 */
router.route('/:id')
  .get(protect, getCampaign)
  .put(protect, validateCampaign, updateCampaign)
  .delete(protect, deleteCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/send:
 *   post:
 *     summary: Send/start a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign delivery started
 *       400:
 *         description: Campaign cannot be sent
 *       404:
 *         description: Campaign not found
 */
router.post('/:id/send', protect, sendCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/pause:
 *   post:
 *     summary: Pause a sending campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign paused
 *       400:
 *         description: Campaign cannot be paused
 *       404:
 *         description: Campaign not found
 */
router.post('/:id/pause', protect, pauseCampaign);

/**
 * @swagger
 * /api/campaigns/{id}/analytics:
 *   get:
 *     summary: Get campaign analytics and insights
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign analytics retrieved successfully
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
 *                     campaign:
 *                       type: object
 *                     statusBreakdown:
 *                       type: array
 *                     timeAnalytics:
 *                       type: array
 *                     aiInsights:
 *                       type: object
 *       404:
 *         description: Campaign not found
 */
router.get('/:id/analytics', protect, getCampaignAnalytics);

module.exports = router;
