const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  totalSpending: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  visits: {
    type: Number,
    default: 0,
    min: 0
  },
  lastVisit: {
    type: Date,
    default: Date.now
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  segment: {
    type: String,
    enum: ['premium', 'regular', 'standard', 'vip', 'bronze', 'silver', 'gold'],
    default: 'regular'
  },
  orderCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastOrderDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
customerSchema.index({ email: 1 });
customerSchema.index({ totalSpending: -1 });
customerSchema.index({ visits: -1 });
customerSchema.index({ lastVisit: -1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ registrationDate: -1 });

// Virtual for days since last visit
customerSchema.virtual('daysSinceLastVisit').get(function() {
  return Math.floor((new Date() - this.lastVisit) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to sync totalSpent with totalSpending
customerSchema.pre('save', function(next) {
  if (this.totalSpending !== undefined) {
    this.totalSpent = this.totalSpending;
  } else if (this.totalSpent !== undefined) {
    this.totalSpending = this.totalSpent;
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
