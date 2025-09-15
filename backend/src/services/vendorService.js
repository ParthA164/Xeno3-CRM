const axios = require('axios');
const CommunicationLog = require('../models/CommunicationLog');
const { v4: uuidv4 } = require('uuid');

class VendorService {
  
  // Simulate sending message via vendor API
  static async sendMessage({ messageId, recipient, message, type = 'email' }) {
    try {
      // Update communication log to sent status
      await CommunicationLog.findOneAndUpdate(
        { messageId },
        { 
          status: 'sent',
          sentAt: new Date(),
          vendorResponse: {
            vendorMessageId: `vendor-${uuidv4()}`,
            status: 'accepted',
            timestamp: new Date()
          }
        }
      );

      // Simulate vendor API call delay
      const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
      setTimeout(async () => {
        await this.simulateDeliveryReceipt(messageId);
      }, delay);

      return {
        success: true,
        vendorMessageId: `vendor-${uuidv4()}`,
        status: 'accepted'
      };

    } catch (error) {
      console.error('Send message error:', error);
      
      // Update communication log to failed status
      await CommunicationLog.findOneAndUpdate(
        { messageId },
        { 
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error.message
        }
      );

      throw error;
    }
  }

  // Simulate delivery receipt callback
  static async simulateDeliveryReceipt(messageId) {
    try {
      const successRate = parseFloat(process.env.VENDOR_API_SUCCESS_RATE) || 0.9;
      const isSuccess = Math.random() < successRate;

      const log = await CommunicationLog.findOne({ messageId });
      if (!log) return;

      if (isSuccess) {
        // Successful delivery
        await CommunicationLog.findOneAndUpdate(
          { messageId },
          { 
            status: 'delivered',
            deliveredAt: new Date(),
            deliveryReceipt: {
              vendorMessageId: log.vendorResponse?.vendorMessageId,
              deliveryStatus: 'delivered',
              deliveryTime: new Date()
            }
          }
        );
      } else {
        // Failed delivery
        const errorCodes = ['INVALID_EMAIL', 'BOUNCE', 'SPAM_FILTER', 'RATE_LIMIT', 'TEMPORARY_FAILURE'];
        const errorCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
        
        await CommunicationLog.findOneAndUpdate(
          { messageId },
          { 
            status: 'failed',
            failedAt: new Date(),
            deliveryReceipt: {
              vendorMessageId: log.vendorResponse?.vendorMessageId,
              deliveryStatus: 'failed',
              deliveryTime: new Date(),
              errorCode,
              errorDescription: this.getErrorDescription(errorCode)
            }
          }
        );
      }

      // Call delivery receipt webhook
      await this.sendDeliveryReceiptWebhook(messageId, isSuccess ? 'delivered' : 'failed');

    } catch (error) {
      console.error('Simulate delivery receipt error:', error);
    }
  }

  // Send delivery receipt to our webhook endpoint
  static async sendDeliveryReceiptWebhook(messageId, status) {
    try {
      const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/delivery-receipt`;
      
      const payload = {
        messageId,
        status,
        timestamp: new Date().toISOString(),
        vendorMessageId: `vendor-${uuidv4()}`,
        metadata: {
          vendor: 'demo-vendor',
          version: '1.0'
        }
      };

      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Vendor-Signature': this.generateSignature(payload)
        },
        timeout: 5000
      });

    } catch (error) {
      console.error('Delivery receipt webhook error:', error);
      // Don't throw - webhook failures shouldn't break the flow
    }
  }

  // Generate dummy signature for webhook verification
  static generateSignature(payload) {
    const crypto = require('crypto');
    const secret = 'webhook-secret-key';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Get error description for error codes
  static getErrorDescription(errorCode) {
    const descriptions = {
      'INVALID_EMAIL': 'The email address format is invalid',
      'BOUNCE': 'The email bounced back from the recipient server',
      'SPAM_FILTER': 'Message was filtered as spam',
      'RATE_LIMIT': 'Rate limit exceeded for this recipient',
      'TEMPORARY_FAILURE': 'Temporary failure, will retry later'
    };

    return descriptions[errorCode] || 'Unknown error occurred';
  }

  // Batch send messages (for better performance)
  static async sendBatchMessages(messages) {
    const results = [];
    
    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push({ messageId: message.messageId, success: true, result });
      } catch (error) {
        results.push({ messageId: message.messageId, success: false, error: error.message });
      }
    }

    return results;
  }

  // Get delivery statistics
  static async getDeliveryStats(campaignId = null) {
    try {
      const filter = campaignId ? { campaignId } : {};
      
      const stats = await CommunicationLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      result.deliveryRate = result.sent > 0 ? (result.delivered / result.sent) * 100 : 0;

      return result;
    } catch (error) {
      console.error('Get delivery stats error:', error);
      throw error;
    }
  }

  // Retry failed messages
  static async retryFailedMessages(campaignId, maxRetries = 3) {
    try {
      const failedLogs = await CommunicationLog.find({
        campaignId,
        status: 'failed',
        retryCount: { $lt: maxRetries }
      });

      const retryResults = [];

      for (const log of failedLogs) {
        try {
          // Reset status and increment retry count
          log.status = 'pending';
          log.retryCount += 1;
          log.errorMessage = '';
          await log.save();

          // Retry sending
          await this.sendMessage({
            messageId: log.messageId,
            recipient: log.recipient.email || log.recipient.phone,
            message: log.message,
            type: log.messageType
          });

          retryResults.push({ messageId: log.messageId, success: true });

        } catch (error) {
          retryResults.push({ messageId: log.messageId, success: false, error: error.message });
        }
      }

      return {
        retriedCount: failedLogs.length,
        results: retryResults
      };

    } catch (error) {
      console.error('Retry failed messages error:', error);
      throw error;
    }
  }

  // Simulate different vendor APIs
  static async sendViaCustomVendor(vendorName, messageData) {
    const vendorConfigs = {
      'sendgrid': {
        baseUrl: 'https://api.sendgrid.com/v3',
        successRate: 0.95,
        avgDelay: 1000
      },
      'twilio': {
        baseUrl: 'https://api.twilio.com/2010-04-01',
        successRate: 0.92,
        avgDelay: 2000
      },
      'mailgun': {
        baseUrl: 'https://api.mailgun.net/v3',
        successRate: 0.88,
        avgDelay: 1500
      }
    };

    const config = vendorConfigs[vendorName] || vendorConfigs['sendgrid'];
    
    // Simulate vendor-specific behavior
    const delay = config.avgDelay + (Math.random() * 1000);
    const successRate = config.successRate;

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (Math.random() < successRate) {
          await this.simulateDeliveryReceipt(messageData.messageId);
          resolve({
            vendor: vendorName,
            messageId: messageData.messageId,
            status: 'accepted',
            vendorMessageId: `${vendorName}-${uuidv4()}`
          });
        } else {
          reject(new Error(`${vendorName} delivery failed`));
        }
      }, delay);
    });
  }
}

module.exports = VendorService;
