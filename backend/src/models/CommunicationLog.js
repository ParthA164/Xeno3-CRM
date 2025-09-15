const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  messageType: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  recipient: {
    email: String,
    phone: String
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  vendorResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  deliveryReceipt: {
    vendorMessageId: String,
    deliveryStatus: String,
    deliveryTime: Date,
    errorCode: String,
    errorDescription: String
  },
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    campaignName: String,
    segmentInfo: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
communicationLogSchema.index({ campaignId: 1 });
communicationLogSchema.index({ customerId: 1 });
communicationLogSchema.index({ messageId: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ sentAt: -1 });
communicationLogSchema.index({ messageType: 1 });

// Compound indexes for analytics
communicationLogSchema.index({ campaignId: 1, status: 1 });
communicationLogSchema.index({ campaignId: 1, createdAt: -1 });

// Update campaign stats after status change
communicationLogSchema.post('save', async function(doc) {
  try {
    if (doc.isModified('status')) {
      const Campaign = mongoose.model('Campaign');
      const stats = await mongoose.model('CommunicationLog').aggregate([
        { $match: { campaignId: doc.campaignId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalSent = stats.find(s => s._id === 'sent')?.count || 0;
      const totalFailed = stats.find(s => s._id === 'failed')?.count || 0;
      const totalDelivered = stats.find(s => s._id === 'delivered')?.count || 0;
      
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

      await Campaign.findByIdAndUpdate(doc.campaignId, {
        'stats.totalSent': totalSent,
        'stats.totalFailed': totalFailed,
        'stats.totalDelivered': totalDelivered,
        'stats.deliveryRate': Math.round(deliveryRate * 100) / 100
      });
    }
  } catch (error) {
    console.error('Error updating campaign stats:', error);
  }
});

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
