const CommunicationLog = require('../models/CommunicationLog');
const crypto = require('crypto');

// @desc    Handle delivery receipt webhook
// @route   POST /api/webhooks/delivery-receipt
// @access  Public (but verified)
const handleDeliveryReceipt = async (req, res) => {
  try {
    const { messageId, status, timestamp, vendorMessageId, metadata } = req.body;

    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-vendor-signature'];
    if (signature && !verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Find the communication log
    const log = await CommunicationLog.findOne({ messageId });
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update delivery status
    const updateData = {
      'deliveryReceipt.vendorMessageId': vendorMessageId,
      'deliveryReceipt.deliveryStatus': status,
      'deliveryReceipt.deliveryTime': new Date(timestamp)
    };

    if (status === 'delivered') {
      updateData.status = 'delivered';
      updateData.deliveredAt = new Date(timestamp);
    } else if (status === 'failed') {
      updateData.status = 'failed';
      updateData.failedAt = new Date(timestamp);
      updateData.errorMessage = metadata?.error || 'Delivery failed';
      updateData['deliveryReceipt.errorCode'] = metadata?.errorCode;
      updateData['deliveryReceipt.errorDescription'] = metadata?.errorDescription;
    }

    await CommunicationLog.findOneAndUpdate({ messageId }, updateData);

    res.status(200).json({
      success: true,
      message: 'Delivery receipt processed'
    });

  } catch (error) {
    console.error('Delivery receipt webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle batch delivery receipts
// @route   POST /api/webhooks/batch-delivery-receipt
// @access  Public (but verified)
const handleBatchDeliveryReceipt = async (req, res) => {
  try {
    const { receipts } = req.body;

    if (!Array.isArray(receipts)) {
      return res.status(400).json({
        success: false,
        message: 'Receipts must be an array'
      });
    }

    const results = [];

    for (const receipt of receipts) {
      try {
        const { messageId, status, timestamp, vendorMessageId } = receipt;
        
        const updateData = {
          'deliveryReceipt.vendorMessageId': vendorMessageId,
          'deliveryReceipt.deliveryStatus': status,
          'deliveryReceipt.deliveryTime': new Date(timestamp)
        };

        if (status === 'delivered') {
          updateData.status = 'delivered';
          updateData.deliveredAt = new Date(timestamp);
        } else if (status === 'failed') {
          updateData.status = 'failed';
          updateData.failedAt = new Date(timestamp);
        }

        await CommunicationLog.findOneAndUpdate({ messageId }, updateData);
        results.push({ messageId, success: true });

      } catch (error) {
        results.push({ messageId: receipt.messageId, success: false, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Batch delivery receipts processed',
      results
    });

  } catch (error) {
    console.error('Batch delivery receipt webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  try {
    const secret = 'webhook-secret-key'; // Should match vendor service
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

module.exports = {
  handleDeliveryReceipt,
  handleBatchDeliveryReceipt
};
