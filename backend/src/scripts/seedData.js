require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');

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
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=1976d2&color=fff',
    role: 'admin',
    isActive: true,
    googleId: 'demo-user-123'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@minicrm.com',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=388e3c&color=fff',
    role: 'user',
    isActive: true,
    googleId: 'demo-user-456'
  }
];

const sampleCustomers = [
  {
    name: 'Alice Cooper',
    email: 'alice.cooper@example.com',
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
    totalSpent: 320.25,
    orderCount: 2,
    lastOrderDate: new Date('2024-06-20'),
    tags: ['potential'],
    preferences: {
      communicationChannel: 'email',
      categories: ['sports', 'outdoors']
    }
  },
  {
    name: 'Emma Garcia',
    email: 'emma.garcia@example.com',
    phone: '+1-555-0105',
    address: '654 Maple Dr, Phoenix, AZ 85001',
    dateOfBirth: new Date('1987-05-08'),
    status: 'active',
    segment: 'premium',
    totalSpent: 1850.00,
    orderCount: 10,
    lastOrderDate: new Date('2024-09-05'),
    tags: ['vip', 'home-decor'],
    preferences: {
      communicationChannel: 'sms',
      categories: ['home', 'garden']
    }
  }
];

const sampleOrders = [
  {
    customerId: null, // Will be set after customers are created
    orderNumber: 'ORD-2024-001',
    items: [
      { 
        productId: 'PROD-001',
        productName: 'Wireless Headphones', 
        quantity: 1, 
        price: 199.99,
        category: 'electronics'
      },
      { 
        productId: 'PROD-002',
        productName: 'Phone Case', 
        quantity: 2, 
        price: 25.00,
        category: 'accessories'
      }
    ],
    amount: 249.99,
    status: 'delivered',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    notes: 'Customer requested express delivery'
  },
  {
    customerId: null,
    orderNumber: 'ORD-2024-002',
    items: [
      { 
        productId: 'PROD-003',
        productName: 'Gaming Mouse', 
        quantity: 1, 
        price: 79.99,
        category: 'electronics'
      },
      { 
        productId: 'PROD-004',
        productName: 'Mousepad', 
        quantity: 1, 
        price: 15.99,
        category: 'accessories'
      }
    ],
    amount: 95.98,
    status: 'shipped',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    notes: 'Gift wrapping requested'
  },
  {
    customerId: null,
    orderNumber: 'ORD-2024-003',
    items: [
      { 
        productId: 'PROD-005',
        productName: 'Designer Handbag', 
        quantity: 1, 
        price: 299.99,
        category: 'fashion'
      },
      { 
        productId: 'PROD-006',
        productName: 'Wallet', 
        quantity: 1, 
        price: 89.99,
        category: 'fashion'
      }
    ],
    amount: 389.98,
    status: 'confirmed',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    notes: 'VIP customer - priority processing'
  },
  {
    customerId: null,
    orderNumber: 'ORD-2024-004',
    items: [
      { 
        productId: 'PROD-007',
        productName: 'Running Shoes', 
        quantity: 1, 
        price: 129.99,
        category: 'sports'
      }
    ],
    amount: 129.99,
    status: 'pending',
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    },
    notes: 'Payment authorization pending'
  },
  {
    customerId: null,
    orderNumber: 'ORD-2024-005',
    items: [
      { 
        productId: 'PROD-008',
        productName: 'Garden Tools Set', 
        quantity: 1, 
        price: 149.99,
        category: 'garden'
      },
      { 
        productId: 'PROD-009',
        productName: 'Plant Pot', 
        quantity: 3, 
        price: 19.99,
        category: 'garden'
      }
    ],
    amount: 209.96,
    status: 'delivered',
    paymentMethod: 'debit_card',
    shippingAddress: {
      street: '654 Maple Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'USA'
    },
    notes: 'Customer very satisfied - left 5-star review'
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
      { field: 'segment', operator: '==', value: 'standard' }
    ],
    naturalLanguageQuery: 'Standard customers interested in technology',
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
      { field: 'segment', operator: '==', value: 'premium' },
      { field: 'totalSpending', operator: '>', value: 1000 }
    ],
    naturalLanguageQuery: 'Premium customers with high spending',
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
    status: 'scheduled',
    scheduledAt: new Date('2024-12-01T09:00:00Z'),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'Black Friday Promotion',
    description: 'Special promotion for Black Friday',
    messageType: 'email',
    message: 'Black Friday is here! Get up to 50% off on selected items.',
    audienceRules: [
      { field: 'segment', operator: '==', value: 'standard' }
    ],
    naturalLanguageQuery: 'Standard customers interested in promotions',
    audienceSize: 85,
    status: 'completed',
    scheduledAt: new Date('2024-11-01T09:00:00Z'),
    sentAt: new Date('2024-11-01T09:00:00Z'),
    completedAt: new Date('2024-11-01T11:30:00Z'),
    stats: {
      totalSent: 85,
      totalDelivered: 82,
      totalFailed: 3,
      deliveryRate: 96.5
    }
  },
  {
    name: 'New Product Launch',
    description: 'Announce new product line to tech enthusiasts',
    messageType: 'both',
    message: 'Introducing our latest tech innovations! Be the first to experience cutting-edge technology.',
    audienceRules: [
      { field: 'segment', operator: '==', value: 'standard' }
    ],
    naturalLanguageQuery: 'Standard segment customers interested in technology',
    audienceSize: 234,
    status: 'scheduled',
    scheduledAt: new Date('2024-09-25T14:00:00Z'),
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'VIP Customer Appreciation',
    description: 'Special thank you message for our top spending customers',
    messageType: 'email',
    message: 'Thank you for being a valued VIP customer! Enjoy exclusive early access to our Black Friday deals.',
    audienceRules: [
      { field: 'totalSpending', operator: '>', value: 1000 },
      { field: 'segment', operator: '==', value: 'premium' }
    ],
    naturalLanguageQuery: 'VIP customers with over $1000 in spending',
    audienceSize: 45,
    status: 'sending',
    scheduledAt: new Date('2024-09-20T08:00:00Z'),
    sentAt: new Date('2024-09-20T08:00:00Z'),
    stats: {
      totalSent: 32,
      totalDelivered: 31,
      totalFailed: 1,
      deliveryRate: 96.9
    }
  },
  {
    name: 'Weekend Flash Sale',
    description: 'Quick SMS blast for weekend sale',
    messageType: 'sms',
    message: 'FLASH SALE! 30% off everything this weekend only. Use code WEEKEND30. Shop now!',
    audienceRules: [
      { field: 'isActive', operator: '==', value: true }
    ],
    naturalLanguageQuery: 'All active customers',
    audienceSize: 456,
    status: 'draft',
    stats: {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      deliveryRate: 0
    }
  },
  {
    name: 'Cart Abandonment Recovery',
    description: 'Remind customers about items left in their cart',
    messageType: 'email',
    message: 'Don\'t forget about the items in your cart! Complete your purchase within 24 hours and get free shipping.',
    audienceRules: [
      { field: 'daysSinceLastVisit', operator: '<=', value: 7 },
      { field: 'isActive', operator: '==', value: true }
    ],
    naturalLanguageQuery: 'Active customers who visited in the last 7 days',
    audienceSize: 89,
    status: 'paused',
    scheduledAt: new Date('2024-09-18T16:00:00Z'),
    stats: {
      totalSent: 23,
      totalDelivered: 22,
      totalFailed: 1,
      deliveryRate: 95.7
    }
  },
  {
    name: 'Birthday Celebration',
    description: 'Send birthday wishes with special discount',
    messageType: 'both',
    message: 'Happy Birthday! 🎉 Celebrate with 20% off your birthday month. Valid all month long!',
    audienceRules: [
      { field: 'registrationDate', operator: '>', value: '2023-01-01' }
    ],
    naturalLanguageQuery: 'Customers registered after January 2023',
    audienceSize: 178,
    status: 'failed',
    scheduledAt: new Date('2024-09-10T10:00:00Z'),
    sentAt: new Date('2024-09-10T10:00:00Z'),
    stats: {
      totalSent: 45,
      totalDelivered: 12,
      totalFailed: 33,
      deliveryRate: 26.7
    }
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await CommunicationLog.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${userData.name}`);
    }

    // Create customers
    const createdCustomers = [];
    for (const customerData of sampleCustomers) {
      const customer = new Customer({
        ...customerData,
        createdBy: createdUsers[0]._id
      });
      const savedCustomer = await customer.save();
      createdCustomers.push(savedCustomer);
      console.log(`✅ Created customer: ${customerData.name}`);
    }

    // Create orders and link to customers
    for (let i = 0; i < sampleOrders.length; i++) {
      const orderData = {
        ...sampleOrders[i],
        customerId: createdCustomers[i]._id,
        createdBy: createdUsers[0]._id
      };
      const order = new Order(orderData);
      await order.save();
      console.log(`✅ Created order: ${orderData.orderNumber}`);
    }

    // Create campaigns
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

    // Create some communication logs
    const communicationLogs = [
      {
        campaignId: createdCampaigns[0]._id,
        customerId: createdCustomers[0]._id,
        messageId: 'MSG-001-' + Date.now(),
        messageType: 'email',
        recipient: {
          email: createdCustomers[0].email
        },
        message: 'Get ready for summer with our exclusive 25% off sale! Limited time offer for our valued premium customers.',
        status: 'delivered',
        sentAt: new Date('2024-07-01T10:00:00Z'),
        deliveredAt: new Date('2024-07-01T10:02:00Z')
      },
      {
        campaignId: createdCampaigns[1]._id,
        customerId: createdCustomers[1]._id,
        messageId: 'MSG-002-' + Date.now(),
        messageType: 'email',
        recipient: {
          email: createdCustomers[1].email
        },
        message: 'We miss you! Come back and enjoy 15% off your next purchase. We have exciting new products waiting for you.',
        status: 'delivered',
        sentAt: new Date('2024-09-15T09:00:00Z'),
        deliveredAt: new Date('2024-09-15T09:01:00Z')
      }
    ];

    for (const logData of communicationLogs) {
      const log = new CommunicationLog(logData);
      await log.save();
      console.log(`✅ Created communication log for customer ${logData.customerId}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created:
    - ${createdUsers.length} users
    - ${createdCustomers.length} customers  
    - ${sampleOrders.length} orders
    - ${createdCampaigns.length} campaigns
    - ${communicationLogs.length} communication logs`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase };
