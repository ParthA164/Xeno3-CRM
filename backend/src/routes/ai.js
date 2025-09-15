const express = require('express');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const AIService = require('../services/aiService');
const AudienceSegmentationService = require('../services/audienceService');

const router = express.Router();

// Validation middleware
const validateNaturalLanguageQuery = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Natural language query is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Query must be between 10 and 500 characters')
];

const validateMessageGeneration = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Original message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  
  body('objective')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Objective must be less than 200 characters')
];

const validateMessageSuggestion = [
  body('campaignType')
    .trim()
    .notEmpty()
    .withMessage('Campaign type is required')
    .isIn(['email', 'sms', 'both'])
    .withMessage('Campaign type must be email, sms, or both'),
  
  body('audienceDescription')
    .trim()
    .notEmpty()
    .withMessage('Audience description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Audience description must be between 10 and 500 characters')
];

/**
 * @swagger
 * /api/ai/suggest-message:
 *   post:
 *     summary: Generate a message suggestion based on campaign type and audience
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignType
 *               - audienceDescription
 *             properties:
 *               campaignType:
 *                 type: string
 *                 enum: [email, sms, both]
 *               audienceDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: string
 *       400:
 *         description: Validation error or AI service unavailable
 */
router.post('/suggest-message', protect, validateMessageSuggestion, async (req, res) => {
  try {
    const { campaignType, audienceDescription } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    // Generate message suggestion
    const suggestedMessage = await AIService.suggestMessage(campaignType, audienceDescription);
    
    if (!suggestedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate message suggestion'
      });
    }

    res.status(200).json({
      success: true,
      data: suggestedMessage
    });
  } catch (error) {
    console.error('Error in suggest-message route:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate message suggestion'
    });
  }
});

/**
 * @swagger
 * /api/ai/message-variants:
 *   post:
 *     summary: Generate message variants with different tones
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               objective:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message variants generated successfully
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
 *                     messageVariants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           tone:
 *                             type: string
 *                           score:
 *                             type: number
 *                     originalMessage:
 *                       type: string
 *       400:
 *         description: Validation error or AI service unavailable
 */
router.post('/message-variants', protect, validateMessageGeneration, async (req, res) => {
  try {
    const { message, objective } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    // Generate message variants
    const variants = await AIService.generateMessageVariants(message, objective);
    
    if (!variants || !variants.messageVariants || variants.messageVariants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate message variants'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        messageVariants: variants.messageVariants,
        originalMessage: message
      }
    });
  } catch (error) {
    console.error('Error in message-variants route:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate message variants'
    });
  }
});
router.post('/parse-language', protect, validateNaturalLanguageQuery, async (req, res) => {
  try {
    const { query } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    // Parse natural language to rules
    const rules = await AIService.parseNaturalLanguageToRules(query);
    
    // Get audience size for the generated rules
    const audienceSize = await AudienceSegmentationService.getAudienceCount(rules);

    res.status(200).json({
      success: true,
      data: {
        rules,
        audienceSize,
        originalQuery: query
      }
    });

  } catch (error) {
    console.error('Parse natural language error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to parse natural language query'
    });
  }
});

/**
 * @swagger
 * /api/ai/message-variants:
 *   post:
 *     summary: Generate message variants with different tones
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hi {name}, here's 10% off on your next order!"
 *               objective:
 *                 type: string
 *                 example: "bring back inactive users"
 *     responses:
 *       200:
 *         description: Message variants generated successfully
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
 *                     messageVariants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           tone:
 *                             type: string
 *                           score:
 *                             type: number
 *                     originalMessage:
 *                       type: string
 *       400:
 *         description: Validation error
 */
router.post('/message-variants', protect, validateMessageGeneration, async (req, res) => {
  try {
    const { message, objective = '' } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        success: true,
        data: {
          messageVariants: [
            { text: message, tone: 'original', score: 85 }
          ],
          originalMessage: message
        }
      });
    }

    const result = await AIService.generateMessageVariants(message, objective);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        originalMessage: message
      }
    });

  } catch (error) {
    console.error('Generate message variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate message variants'
    });
  }
});

/**
 * @swagger
 * /api/ai/audience-insights:
 *   post:
 *     summary: Get AI-generated insights about audience segment
 *     tags: [AI Features]
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
 *               - audienceSize
 *             properties:
 *               audienceRules:
 *                 type: array
 *                 items:
 *                   type: object
 *               audienceSize:
 *                 type: number
 *     responses:
 *       200:
 *         description: Audience insights generated successfully
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
 *                     description:
 *                       type: string
 *                     characteristics:
 *                       type: array
 *                     opportunities:
 *                       type: array
 *                     recommendedMessage:
 *                       type: string
 */
router.post('/audience-insights', protect, async (req, res) => {
  try {
    const { audienceRules, audienceSize } = req.body;

    if (!audienceRules || !Array.isArray(audienceRules)) {
      return res.status(400).json({
        success: false,
        message: 'Audience rules are required'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        success: true,
        data: {
          description: `This segment contains ${audienceSize} customers based on the specified criteria.`,
          characteristics: ['Defined by custom rules', 'Targeted segment'],
          opportunities: ['Personalized campaigns', 'Targeted offers'],
          recommendedMessage: 'Personalized message based on customer preferences'
        }
      });
    }

    const insights = await AIService.generateAudienceInsights(audienceRules, audienceSize);

    res.status(200).json({
      success: true,
      data: insights || {
        description: `This segment contains ${audienceSize} customers based on the specified criteria.`,
        characteristics: ['Custom audience segment'],
        opportunities: ['Targeted marketing'],
        recommendedMessage: 'Personalized approach recommended'
      }
    });

  } catch (error) {
    console.error('Generate audience insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate audience insights'
    });
  }
});

/**
 * @swagger
 * /api/ai/optimal-send-time:
 *   post:
 *     summary: Get AI suggestion for optimal campaign send time
 *     tags: [AI Features]
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
 *               messageType:
 *                 type: string
 *                 enum: [email, sms]
 *                 default: email
 *     responses:
 *       200:
 *         description: Optimal send time suggested successfully
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
 *                     recommendedTime:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     reasoning:
 *                       type: string
 *                     alternativeTime:
 *                       type: string
 */
router.post('/optimal-send-time', protect, async (req, res) => {
  try {
    const { audienceRules, messageType = 'email' } = req.body;

    if (!audienceRules || !Array.isArray(audienceRules)) {
      return res.status(400).json({
        success: false,
        message: 'Audience rules are required'
      });
    }

    const suggestion = await AIService.suggestOptimalSendTime(audienceRules, messageType);

    res.status(200).json({
      success: true,
      data: suggestion
    });

  } catch (error) {
    console.error('Optimal send time suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest optimal send time'
    });
  }
});

/**
 * @swagger
 * /api/ai/generate-sample-customers:
 *   post:
 *     summary: Generate sample customer data for testing (Admin only)
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *     responses:
 *       200:
 *         description: Sample customers generated successfully
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
 *                     type: object
 *       400:
 *         description: AI service not available
 */
router.post('/generate-sample-customers', protect, async (req, res) => {
  try {
    const { count = 10 } = req.body;

    if (count < 1 || count > 50) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    const sampleCustomers = await AIService.generateSampleCustomers(count);

    res.status(200).json({
      success: true,
      data: sampleCustomers
    });

  } catch (error) {
    console.error('Generate sample customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample customers'
    });
  }
});

module.exports = router;
