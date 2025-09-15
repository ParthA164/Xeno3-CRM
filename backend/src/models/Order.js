const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  items: [{
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      trim: true
    }
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'],
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ amount: -1 });
orderSchema.index({ 'items.category': 1 });

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Update customer stats after order save
orderSchema.post('save', async function(doc) {
  try {
    const Customer = mongoose.model('Customer');
    const totalSpent = await mongoose.model('Order').aggregate([
      { $match: { customerId: doc.customerId, status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const orderCount = await mongoose.model('Order').countDocuments({
      customerId: doc.customerId,
      status: { $in: ['confirmed', 'shipped', 'delivered'] }
    });

    await Customer.findByIdAndUpdate(doc.customerId, {
      totalSpending: totalSpent[0]?.total || 0,
      visits: orderCount,
      lastVisit: doc.orderDate
    });
  } catch (error) {
    console.error('Error updating customer stats:', error);
  }
});

module.exports = mongoose.model('Order', orderSchema);
