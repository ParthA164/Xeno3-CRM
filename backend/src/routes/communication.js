const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');
const Customer = require('../models/Customer');

/**
 * @swagger
 * /api/communication/send-email:
 *   post:
 *     summary: Send email to a customer
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - subject
 *               - message
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID
 *               subject:
 *                 type: string
 *                 description: Email subject
 *               message:
 *                 type: string
 *                 description: Email message
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 messageId:
 *                   type: string
 *                 previewUrl:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/send-email', protect, async (req, res) => {
  try {
    const { customerId, subject, message } = req.body;

    // Validate required fields
    if (!customerId || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, subject, and message are required'
      });
    }

    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has email
    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer does not have an email address'
      });
    }

    // Send the email
    const result = await emailService.sendEmail(
      customer.email,
      subject,
      message,
      customerId
    );

    res.json({
      success: true,
      message: `Email sent successfully to ${customer.name}`,
      messageId: result.messageId,
      previewUrl: result.previewUrl
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
});

/**
 * @swagger
 * /api/communication/send-sms:
 *   post:
 *     summary: Send SMS to a customer
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - message
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: Customer ID
 *               message:
 *                 type: string
 *                 description: SMS message
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/send-sms', protect, async (req, res) => {
  try {
    const { customerId, message } = req.body;

    // Validate required fields
    if (!customerId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and message are required'
      });
    }

    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has phone
    if (!customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer does not have a phone number'
      });
    }

    // Send the SMS
    const result = await emailService.sendSMS(
      customer.phone,
      message,
      customerId
    );

    res.json({
      success: true,
      message: `SMS sent successfully to ${customer.name}`,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS'
    });
  }
});

/**
 * @swagger
 * /api/communication/history/{customerId}:
 *   get:
 *     summary: Get communication history for a customer
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Communication history retrieved successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get('/history/:customerId', protect, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Find the customer to ensure it exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get communication history
    const CommunicationLog = require('../models/CommunicationLog');
    const history = await CommunicationLog.find({ customer: customerId })
      .sort({ sentAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communication history'
    });
  }
});

module.exports = router;
