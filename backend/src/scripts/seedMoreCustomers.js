require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Customer = require('../models/Customer');

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

// Generate random customer data
const generateCustomer = () => {
  const segments = ['premium', 'regular', 'standard', 'vip', 'bronze', 'silver', 'gold'];
  const statuses = ['active', 'inactive', 'pending'];
  const tags = ['tech-enthusiast', 'frequent-buyer', 'new-customer', 'vip', 'deals-hunter', 
                'fashion-lover', 'electronics', 'home-goods', 'sports', 'outdoors'];
  
  // Random registration date between 2 years ago and now
  const registrationDate = faker.date.between({ 
    from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), 
    to: new Date() 
  });
  
  // Random last visit date after registration date
  const lastVisit = faker.date.between({ 
    from: registrationDate, 
    to: new Date() 
  });
  
  // Generate random customer tags (0-3 tags)
  const numTags = Math.floor(Math.random() * 4);
  const randomTags = [];
  for (let i = 0; i < numTags; i++) {
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    if (!randomTags.includes(randomTag)) {
      randomTags.push(randomTag);
    }
  }
  
  // Generate random visits (1-50)
  const visits = Math.floor(Math.random() * 50) + 1;
  
  // Generate random spending based on segment
  let segment = segments[Math.floor(Math.random() * segments.length)];
  let totalSpending;
  
  if (segment === 'vip') {
    totalSpending = faker.number.int({ min: 50000, max: 100000 });
  } else if (segment === 'premium' || segment === 'gold') {
    totalSpending = faker.number.int({ min: 20000, max: 49999 });
  } else if (segment === 'regular' || segment === 'silver') {
    totalSpending = faker.number.int({ min: 5000, max: 19999 });
  } else {
    totalSpending = faker.number.int({ min: 500, max: 4999 });
  }
  
  // Generate order count based on spending
  const avgOrderValue = faker.number.int({ min: 500, max: 2000 });
  const orderCount = Math.ceil(totalSpending / avgOrderValue);
  
  // Random last order date after registration and before or equal to last visit
  const lastOrderDate = orderCount > 0 ? faker.date.between({ 
    from: registrationDate, 
    to: lastVisit 
  }) : undefined;
  
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    totalSpending: totalSpending,
    totalSpent: totalSpending,
    visits: visits,
    lastVisit: lastVisit,
    registrationDate: registrationDate,
    isActive: Math.random() > 0.2, // 80% are active
    status: statuses[Math.floor(Math.random() * statuses.length)],
    segment: segment,
    orderCount: orderCount,
    lastOrderDate: lastOrderDate,
    tags: randomTags,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    preferences: {
      emailNotifications: Math.random() > 0.3, // 70% prefer email
      smsNotifications: Math.random() > 0.6 // 40% prefer SMS
    }
  };
};

// Seed data
const seedCustomers = async (count = 100) => {
  try {
    // Clear existing customers
    // await Customer.deleteMany({});
    console.log('Starting to seed customers...');
    
    // Create array of customer documents
    const customers = [];
    for (let i = 0; i < count; i++) {
      customers.push(generateCustomer());
    }
    
    // Insert all customers
    await Customer.insertMany(customers);
    
    console.log(`Successfully seeded ${count} customers`);
    return customers.length;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    const count = process.argv[2] ? parseInt(process.argv[2]) : 100;
    await seedCustomers(count);
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

main();