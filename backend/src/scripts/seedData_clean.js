require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');
const Settings = require('../models/Settings');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2a$10$8N9M/kTfM1B8xJGm5B3qKuRGnGzXa6YkW5L7z2F4Z8J1D2Q3M4R5S6',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  }
];

const sampleCustomers = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-0101',
    status: 'active',
    segment: 'premium',
    totalSpending: 1250.00,
    totalSpent: 1250.00,
    orderCount: 8,
    lastOrderDate: new Date('2024-09-01'),
    visits: 15,
    lastVisit: new Date('2024-09-01'),
    isActive: true,
    tags: ['vip', 'frequent-buyer']
  },
  {
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phone: '+1-555-0102',
    status: 'active',
    segment: 'standard',
    totalSpending: 750.50,
    totalSpent: 750.50,
    orderCount: 5,
    lastOrderDate: new Date('2024-08-15'),
    visits: 10,
    lastVisit: new Date('2024-08-15'),
    isActive: true,
    tags: ['tech-enthusiast']
  },
  {
    name: 'Catherine Davis',
    email: 'catherine.davis@example.com',
    phone: '+1-555-0103',
    address: '789 Pine Rd, Chicago, IL 60601',
    dateOfBirth: new Date('1988-11-30'),
    status: 'active',
    segment: 'premium',
    totalSpent: 2100.75,
    orderCount: 12,
    lastOrderDate: new Date('2024-09-10'),
    tags: ['vip', 'fashion-lover'],
    preferences: {
      communicationChannel: 'email',
      categories: ['fashion', 'beauty']
    }
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+1-555-0104',
    address: '321 Elm St, Houston, TX 77001',
    dateOfBirth: new Date('1992-01-18'),
    status: 'inactive',
    segment: 'standard',
    totalSpent: 299.99,
    orderCount: 2,
    lastOrderDate: new Date('2024-06-20'),
    tags: ['occasional-buyer'],
    preferences: {
      communicationChannel: 'email'
    }
  },
  {
    name: 'Emma Garcia',
    email: 'emma.garcia@example.com',
    phone: '+1-555-0105',
    address: '654 Oak Ave, Phoenix, AZ 85001',
    dateOfBirth: new Date('1995-07-22'),
    status: 'active',
    segment: 'premium',
    totalSpent: 1850.25,
    orderCount: 9,
    lastOrderDate: new Date('2024-09-05'),
    tags: ['tech-enthusiast', 'early-adopter'],
    preferences: {
      communicationChannel: 'sms',
      categories: ['electronics', 'gadgets']
    }
  }
];

const sampleCampaigns = [
  {
    name: 'Summer Sale 2024',
    description: 'Boost summer sales with targeted discounts for premium customers',
    messageType: 'email',
    message: 'Get ready for summer with our exclusive 25% off sale! Limited time offer for our valued premium customers.',
    audienceRules: [
      { field: 'segment', operator: '==', value: 'premium' },
      { field: 'totalSpending', operator: '>', value: 500 }
    ],
    naturalLanguageQuery: 'Premium customers who spent more than $500',
    audienceSize: 120,
    status: 'completed',
    scheduledAt: new Date('2024-07-01T10:00:00Z'),
    sentAt: new Date('2024-07-01T10:00:00Z'),
    completedAt: new Date('2024-07-01T12:00:00Z'),
    stats: {
      totalSent: 120,
      totalDelivered: 118,
      totalFailed: 2,
      deliveryRate: 98.3
    }
  },
  {
    name: 'Re-engagement Campaign',
    description: 'Win back inactive customers with special offers',
    messageType: 'email',
    message: 'We miss you! Come back and enjoy 15% off your next purchase. We have exciting new products waiting for you.',
    audienceRules: [
      { field: 'isActive', operator: '==', value: false },
      { field: 'daysSinceLastVisit', operator: '>', value: 90 }
    ],
    naturalLanguageQuery: 'Inactive customers who haven\'t visited in 90+ days',
    audienceSize: 85,
    status: 'completed',
    scheduledAt: new Date('2024-09-15T09:00:00Z'),
    sentAt: new Date('2024-09-15T09:00:00Z'),
    completedAt: new Date('2024-09-15T11:30:00Z'),
    stats: {
      totalSent: 85,
      totalDelivered: 82,
      totalFailed: 3,
      deliveryRate: 96.5
    }
  },
  {
    name: 'Black Friday Deals',
    description: 'Major shopping event targeting all active customers',
    messageType: 'email',
    message: 'BLACK FRIDAY IS HERE! 🛍️ Get up to 70% off on all categories. Shop now before deals expire!',
    audienceRules: [
      { field: 'isActive', operator: '==', value: true }
    ],
    naturalLanguageQuery: 'All active customers',
    audienceSize: 450,
    status: 'scheduled',
    scheduledAt: new Date('2024-11-29T08:00:00Z'),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'New Product Launch',
    description: 'Announce new tech products to tech enthusiasts',
    messageType: 'email',
    message: 'Exciting news! 🚀 We just launched our latest tech collection. Be among the first to experience innovation.',
    audienceRules: [
      { field: 'segment', operator: '==', value: 'premium' }
    ],
    naturalLanguageQuery: 'Premium customers interested in technology',
    audienceSize: 75,
    status: 'draft',
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'VIP Customer Appreciation',
    description: 'Exclusive offers for VIP customers',
    messageType: 'email',
    message: 'Thank you for being a VIP customer! 💎 Enjoy exclusive early access to our premium collection.',
    audienceRules: [
      { field: 'totalSpending', operator: '>', value: 1000 }
    ],
    naturalLanguageQuery: 'VIP customers with high spending',
    audienceSize: 25,
    status: 'scheduled',
    scheduledAt: new Date('2024-12-15T10:00:00Z'),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'Holiday Newsletter',
    description: 'Monthly newsletter with holiday themes',
    messageType: 'email',
    message: 'Happy Holidays! 🎄 Check out our holiday gift guide and special seasonal offers.',
    audienceRules: [
      { field: 'isActive', operator: '==', value: true }
    ],
    naturalLanguageQuery: 'Active customers who prefer email communication',
    audienceSize: 320,
    status: 'sending',
    scheduledAt: new Date('2024-12-01T09:00:00Z'),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  }
];

const sampleOrders = [
  {
    orderNumber: 'ORD-2024-001',
    amount: 299.99,
    status: 'delivered',
    paymentMethod: 'credit_card',
    items: [
      {
        productId: 'PROD-001',
        productName: 'Wireless Headphones',
        quantity: 1,
        price: 299.99,
        category: 'electronics'
      }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    orderDate: new Date('2024-09-01')
  },
  {
    orderNumber: 'ORD-2024-002',
    amount: 89.99,
    status: 'processing',
    paymentMethod: 'upi',
    items: [
      {
        productId: 'PROD-002',
        productName: 'Phone Case',
        quantity: 2,
        price: 44.99,
        category: 'accessories'
      }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA'
    },
    orderDate: new Date('2024-09-10')
  },
  {
    orderNumber: 'ORD-2024-003',
    amount: 389.98,
    status: 'processing',
    paymentMethod: 'net_banking',
    items: [
      {
        productId: 'PROD-003',
        productName: 'Smart Watch',
        quantity: 1,
        price: 389.98,
        category: 'electronics'
      }
    ],
    shippingAddress: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    orderDate: new Date('2024-09-13')
  },
  {
    orderNumber: 'ORD-2024-004',
    amount: 129.99,
    status: 'delivered',
    paymentMethod: 'debit_card',
    items: [
      {
        productId: 'PROD-004',
        productName: 'Bluetooth Speaker',
        quantity: 1,
        price: 129.99,
        category: 'electronics'
      }
    ],
    shippingAddress: {
      street: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    },
    orderDate: new Date('2024-09-13')
  },
  {
    orderNumber: 'ORD-2024-005',
    amount: 209.96,
    status: 'processing',
    paymentMethod: 'cash_on_delivery',
    items: [
      {
        productId: 'PROD-005',
        productName: 'Hair Dryer',
        quantity: 1,
        price: 209.96,
        category: 'home'
      }
    ],
    shippingAddress: {
      street: '654 Oak Ave',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'USA'
    },
    orderDate: new Date('2024-09-13')
  }
];

// Main seeding function
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await CommunicationLog.deleteMany({});
    await Settings.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${userData.email}`);
    }

    // Create customers
    console.log('👤 Creating customers...');
    const createdCustomers = [];
    for (const customerData of sampleCustomers) {
      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      createdCustomers.push(savedCustomer);
      console.log(`✅ Created customer: ${customerData.name}`);
    }

    // Create orders
    console.log('📦 Creating orders...');
    const createdOrders = [];
    for (let i = 0; i < sampleOrders.length; i++) {
      const orderData = {
        ...sampleOrders[i],
        customerId: createdCustomers[i % createdCustomers.length]._id
      };
      const order = new Order(orderData);
      const savedOrder = await order.save();
      createdOrders.push(savedOrder);
      console.log(`✅ Created order: ${orderData.orderNumber}`);
    }

    // Create campaigns
    console.log('📢 Creating campaigns...');
    const createdCampaigns = [];
    for (const campaignData of sampleCampaigns) {
      const campaign = new Campaign({
        ...campaignData,
        createdBy: createdUsers[0]._id
      });
      const savedCampaign = await campaign.save();
      createdCampaigns.push(savedCampaign);
      console.log(`✅ Created campaign: ${campaignData.name}`);
    }

    // Create default settings for users
    console.log('⚙️ Creating default settings...');
    const createdSettings = [];
    for (const user of createdUsers) {
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
      const savedSettings = await defaultSettings.save();
      createdSettings.push(savedSettings);
      console.log(`✅ Created settings for user: ${user.email}`);
    }

    console.log(`
🎉 Seeding completed successfully!
📊 Summary:
    - ${createdUsers.length} users
    - ${createdCustomers.length} customers  
    - ${createdOrders.length} orders
    - ${createdCampaigns.length} campaigns
    - ${createdSettings.length} user settings
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
