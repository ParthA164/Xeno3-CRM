const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');

// @desc    Get all customers with pagination and filtering
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.segment) {
      filter.segment = req.query.segment;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Spending range filters
    if (req.query.minSpending) {
      filter.totalSpending = { $gte: parseFloat(req.query.minSpending) };
    }

    if (req.query.maxSpending) {
      filter.totalSpending = { ...filter.totalSpending, $lte: parseFloat(req.query.maxSpending) };
    }

    // Order count filters
    if (req.query.minOrders) {
      filter.orderCount = { $gte: parseInt(req.query.minOrders) };
    }

    if (req.query.maxOrders) {
      filter.orderCount = { ...filter.orderCount, $lte: parseInt(req.query.maxOrders) };
    }

    // Registration date filters
    if (req.query.joinedAfter) {
      filter.createdAt = { $gte: new Date(req.query.joinedAfter) };
    }

    if (req.query.joinedBefore) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.joinedBefore) };
    }

    // Last order date filters
    if (req.query.lastOrderAfter) {
      filter.lastOrderDate = { $gte: new Date(req.query.lastOrderAfter) };
    }

    if (req.query.lastOrderBefore) {
      filter.lastOrderDate = { ...filter.lastOrderDate, $lte: new Date(req.query.lastOrderBefore) };
    }

    // Tags filter
    if (req.query.tags) {
      const tags = req.query.tags.split(',').filter(tag => tag.trim());
      if (tags.length > 0) {
        filter.tags = { $in: tags };
      }
    }

    if (req.query.minSpending) {
      filter.totalSpending = { $gte: parseFloat(req.query.minSpending) };
    }

    if (req.query.maxSpending) {
      filter.totalSpending = { ...filter.totalSpending, $lte: parseFloat(req.query.maxSpending) };
    }

    if (req.query.minVisits) {
      filter.visits = { $gte: parseInt(req.query.minVisits) };
    }

    if (req.query.maxVisits) {
      filter.visits = { ...filter.visits, $lte: parseInt(req.query.maxVisits) };
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const customers = await Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-__v');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's orders
    const Order = require('../models/Order');
    const orders = await Order.find({ customerId: customer._id })
      .sort({ orderDate: -1 })
      .limit(10)
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        customer,
        orders,
        stats: {
          daysSinceLastVisit: customer.daysSinceLastVisit,
          segment: customer.segment
        }
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const customerData = req.body;

    // Check if customer with email already exists
    const existingCustomer = await Customer.findOne({ email: customerData.email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (req.body.email && req.body.email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email: req.body.email });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk create customers
// @route   POST /api/customers/bulk
// @access  Private
const bulkCreateCustomers = async (req, res) => {
  try {
    const { customers } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of customers'
      });
    }

    if (customers.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 1000 customers can be created at once'
      });
    }

    // Validate each customer
    const validationErrors = [];
    const validCustomers = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      if (!customer.name || !customer.email) {
        validationErrors.push({
          index: i,
          message: 'Name and email are required'
        });
        continue;
      }

      // Check for duplicate emails within the batch
      const duplicateIndex = validCustomers.findIndex(c => c.email === customer.email);
      if (duplicateIndex !== -1) {
        validationErrors.push({
          index: i,
          message: `Duplicate email found at index ${duplicateIndex}`
        });
        continue;
      }

      validCustomers.push(customer);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors: validationErrors
      });
    }

    // Check for existing customers by email
    const emails = validCustomers.map(c => c.email);
    const existingCustomers = await Customer.find({ email: { $in: emails } });
    
    if (existingCustomers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some customers already exist',
        existingEmails: existingCustomers.map(c => c.email)
      });
    }

    // Create customers
    const createdCustomers = await Customer.insertMany(validCustomers);

    res.status(201).json({
      success: true,
      data: createdCustomers,
      message: `${createdCustomers.length} customers created successfully`
    });
  } catch (error) {
    console.error('Bulk create customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalSpending: { $sum: '$totalSpending' },
          averageSpending: { $avg: '$totalSpending' },
          totalVisits: { $sum: '$visits' },
          averageVisits: { $avg: '$visits' }
        }
      }
    ]);

    const segmentStats = await Customer.aggregate([
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalSpending', 50000] }, then: 'VIP' },
                { case: { $gte: ['$totalSpending', 20000] }, then: 'Premium' },
                { case: { $gte: ['$totalSpending', 5000] }, then: 'Regular' }
              ],
              default: 'New'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCustomers: 0,
          activeCustomers: 0,
          totalSpending: 0,
          averageSpending: 0,
          totalVisits: 0,
          averageVisits: 0
        },
        segments: segmentStats
      }
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkCreateCustomers,
  getCustomerStats
};
