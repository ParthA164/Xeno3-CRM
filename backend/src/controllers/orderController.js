const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all orders with pagination and filtering
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.minAmount) {
      filter.amount = { $gte: parseFloat(req.query.minAmount) };
    }

    if (req.query.maxAmount) {
      filter.amount = { ...filter.amount, $lte: parseFloat(req.query.maxAmount) };
    }

    if (req.query.startDate || req.query.endDate) {
      filter.orderDate = {};
      if (req.query.startDate) {
        filter.orderDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.orderDate.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    // Add search functionality
    if (req.query.search) {
      const searchTerm = req.query.search;
      // First find customers matching the search
      const customers = await Customer.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      
      filter.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { customerId: { $in: customerIds } }
      ];
    }

    // Sorting
    const sortField = req.query.sortBy || 'orderDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const orders = await Order.find(filter)
      .populate('customerId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    // Transform the response to match frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderNumber,
      customerId: order.customerId._id,
      customerName: order.customerId.name,
      customerEmail: order.customerId.email,
      orderDate: order.orderDate,
      status: order.status,
      totalAmount: order.amount,
      items: order.items,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod
    }));

    const total = await Order.countDocuments(filter);

    // Return data directly for simplicity (matching frontend expectations)
    res.status(200).json(transformedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .select('-__v');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const orderData = req.body;
    let customerId = orderData.customerId;

    // If customerData is provided instead of customerId, create the customer first
    if (!customerId && orderData.customerData) {
      const customerData = orderData.customerData;
      
      // Check if customer already exists by email
      let customer = await Customer.findOne({ email: customerData.email });
      
      if (!customer) {
        // Create new customer
        customer = new Customer({
          name: customerData.name,
          email: customerData.email,
          address: customerData.address,
          phone: customerData.phone || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await customer.save();
      }
      
      customerId = customer._id;
      // Remove customerData from orderData and add customerId
      delete orderData.customerData;
      orderData.customerId = customerId;
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate unique order number
    orderData.orderNumber = orderData.orderNumber || `ORD-${Date.now()}-${uuidv4().substr(0, 8)}`;

    // Check if order number already exists
    const existingOrder = await Order.findOne({ orderNumber: orderData.orderNumber });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists'
      });
    }

    // Calculate total amount if not provided
    if (!orderData.amount && orderData.items && orderData.items.length > 0) {
      orderData.amount = orderData.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }

    const order = new Order(orderData);
    await order.save();

    // Populate customer data for response
    await order.populate('customerId', 'name email');

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order number is being changed and if new order number already exists
    if (req.body.orderNumber && req.body.orderNumber !== order.orderNumber) {
      const existingOrder = await Order.findOne({ orderNumber: req.body.orderNumber });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Order number already exists'
        });
      }
    }

    // Recalculate amount if items are updated
    if (req.body.items && req.body.items.length > 0) {
      req.body.amount = req.body.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'name email').select('-__v');

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk create orders
// @route   POST /api/orders/bulk
// @access  Private
const bulkCreateOrders = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of orders'
      });
    }

    if (orders.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 500 orders can be created at once'
      });
    }

    // Validate each order
    const validationErrors = [];
    const validOrders = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      if (!order.customerId || !order.amount || !order.paymentMethod) {
        validationErrors.push({
          index: i,
          message: 'customerId, amount, and paymentMethod are required'
        });
        continue;
      }

      // Generate order number if not provided
      if (!order.orderNumber) {
        order.orderNumber = `ORD-${Date.now()}-${uuidv4().substr(0, 8)}-${i}`;
      }

      // Check for duplicate order numbers within the batch
      const duplicateIndex = validOrders.findIndex(o => o.orderNumber === order.orderNumber);
      if (duplicateIndex !== -1) {
        validationErrors.push({
          index: i,
          message: `Duplicate order number found at index ${duplicateIndex}`
        });
        continue;
      }

      validOrders.push(order);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors: validationErrors
      });
    }

    // Check for existing orders by order number
    const orderNumbers = validOrders.map(o => o.orderNumber);
    const existingOrders = await Order.find({ orderNumber: { $in: orderNumbers } });
    
    if (existingOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some order numbers already exist',
        existingOrderNumbers: existingOrders.map(o => o.orderNumber)
      });
    }

    // Verify all customers exist
    const customerIds = [...new Set(validOrders.map(o => o.customerId))];
    const existingCustomers = await Customer.find({ _id: { $in: customerIds } });
    
    if (existingCustomers.length !== customerIds.length) {
      const existingCustomerIds = existingCustomers.map(c => c._id.toString());
      const missingCustomerIds = customerIds.filter(id => !existingCustomerIds.includes(id));
      
      return res.status(400).json({
        success: false,
        message: 'Some customers not found',
        missingCustomerIds
      });
    }

    // Create orders
    const createdOrders = await Order.insertMany(validOrders);

    res.status(201).json({
      success: true,
      data: createdOrders,
      message: `${createdOrders.length} orders created successfully`
    });
  } catch (error) {
    console.error('Bulk create orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          averageOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const pendingOrders = statusCounts.find(s => s._id === 'pending')?.count || 0;
    const completedOrders = statusCounts.find(s => s._id === 'delivered')?.count || 0;

    const stats = {
      totalOrders,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
      averageOrderValue: revenueResult[0]?.averageOrderValue || 0,
      pendingOrders,
      completedOrders
    };

    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  bulkCreateOrders,
  getOrderStats
};
