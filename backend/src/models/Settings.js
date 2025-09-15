const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Notification Settings
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    campaignUpdates: {
      type: Boolean,
      default: true
    },
    orderUpdates: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    }
  },

  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    dataSharing: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: true
    }
  },

  // API Configuration
  apiConfig: {
    webhookUrl: {
      type: String,
      default: ''
    },
    apiKey: {
      type: String,
      default: ''
    },
    rateLimitPerHour: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000
    }
  },

  // Display Settings
  display: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'INR'],
      default: 'USD'
    }
  },

  // Integration Settings
  integrations: {
    emailProvider: {
      type: String,
      enum: ['sendgrid', 'mailgun', 'ses', 'smtp'],
      default: 'sendgrid'
    },
    smsProvider: {
      type: String,
      enum: ['twilio', 'nexmo', 'aws-sns'],
      default: 'twilio'
    },
    paymentProvider: {
      type: String,
      enum: ['stripe', 'paypal', 'square'],
      default: 'stripe'
    }
  },

  // Security Settings
  security: {
    twoFactorAuth: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 30, // minutes
      min: 5,
      max: 1440
    },
    passwordExpiry: {
      type: Number,
      default: 90, // days
      min: 30,
      max: 365
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
