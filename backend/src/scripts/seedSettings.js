const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-crm');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedSettings = async () => {
  try {
    await connectDB();

    // Get all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // Create default settings for each user if they don't exist
    for (const user of users) {
      const existingSettings = await Settings.findOne({ userId: user._id });
      
      if (!existingSettings) {
        const defaultSettings = new Settings({
          userId: user._id,
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            campaignUpdates: true,
            orderUpdates: true,
            systemAlerts: true
          },
          privacy: {
            profileVisibility: 'private',
            dataSharing: false,
            analytics: true
          },
          apiConfig: {
            webhookUrl: '',
            apiKey: require('crypto').randomBytes(32).toString('hex'),
            rateLimitPerHour: 1000
          },
          display: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            currency: 'USD'
          },
          integrations: {
            emailProvider: 'sendgrid',
            smsProvider: 'twilio',
            paymentProvider: 'stripe'
          },
          security: {
            twoFactorAuth: false,
            sessionTimeout: 30,
            passwordExpiry: 90
          }
        });

        await defaultSettings.save();
        console.log(`✅ Created default settings for user: ${user.email}`);
      } else {
        console.log(`⚠️  Settings already exist for user: ${user.email}`);
      }
    }

    console.log('\n🎉 Settings seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
if (require.main === module) {
  seedSettings();
}

module.exports = { seedSettings };
