const express = require('express');
const {
  handleDeliveryReceipt,
  handleBatchDeliveryReceipt
} = require('../controllers/webhookController');

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/delivery-receipt:
 *   post:
 *     summary: Handle delivery receipt webhook from vendor
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *               - status
 *               - timestamp
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [delivered, failed]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               vendorMessageId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Delivery receipt processed successfully
 *       404:
 *         description: Message not found
 *       401:
 *         description: Invalid webhook signature
 */
router.post('/delivery-receipt', handleDeliveryReceipt);

/**
 * @swagger
 * /api/webhooks/batch-delivery-receipt:
 *   post:
 *     summary: Handle batch delivery receipts webhook from vendor
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receipts
 *             properties:
 *               receipts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - messageId
 *                     - status
 *                     - timestamp
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [delivered, failed]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     vendorMessageId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Batch delivery receipts processed successfully
 *       400:
 *         description: Invalid request format
 */
router.post('/batch-delivery-receipt', handleBatchDeliveryReceipt);

module.exports = router;
