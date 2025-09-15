const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audienceRules: [{
    field: {
      type: String,
      required: true,
      enum: ['totalSpending', 'visits', 'daysSinceLastVisit', 'registrationDate', 'segment', 'isActive']
    },
    operator: {
      type: String,
      required: true,
      enum: ['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    logicalOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  naturalLanguageQuery: {
    type: String,
    trim: true
  },
  audienceSize: {
    type: Number,
    default: 0
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['email', 'sms', 'both'],
    default: 'email'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  stats: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalFailed: {
      type: Number,
      default: 0
    },
    totalDelivered: {
      type: Number,
      default: 0
    },
    deliveryRate: {
      type: Number,
      default: 0
    }
  },
  aiSuggestions: {
    messageVariants: [{
      text: String,
      tone: String,
      score: Number
    }],
    audienceInsights: String,
    performancePrediction: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ scheduledAt: 1 });

// Update stats virtual
campaignSchema.virtual('deliveryRatePercentage').get(function() {
  if (this.stats.totalSent === 0) return 0;
  return Math.round((this.stats.totalDelivered / this.stats.totalSent) * 100);
});

module.exports = mongoose.model('Campaign', campaignSchema);
