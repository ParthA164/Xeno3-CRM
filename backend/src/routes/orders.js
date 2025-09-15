const express = require('express');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { dataLimiter } = require('../middleware/rateLimiter');
const {
  validateOrder,
  validateMongoId,
  validateOrderFilters,
  validateBulkOrders
} = require('../middleware/validation');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  bulkCreateOrders,
  getOrderStats
} = require('../controllers/orderController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         customerId:
 *           type: string
 *         orderNumber:
 *           type: string
 *         amount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *         shippingAddress:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, upi, net_banking, cash_on_delivery]
 *         orderDate:
 *           type: string
 *           format: date-time
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders with pagination and filtering
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *         description: Filter by order status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum order amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum order amount
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [credit_card, debit_card, upi, net_banking, cash_on_delivery]
 *         description: Filter by payment method
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               customerId:
 *                 type: string
 *               orderNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - productName
 *                     - quantity
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     category:
 *                       type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, upi, net_banking, cash_on_delivery]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.route('/')
  .get(protect, dataLimiter, validateOrderFilters, getOrders)
  .post(protect, dataLimiter, validateOrder, createOrder);

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                     statusBreakdown:
 *                       type: array
 *                     monthlyTrends:
 *                       type: array
 *                     topCustomers:
 *                       type: array
 */
router.get('/stats', protect, getOrderStats);

/**
 * @swagger
 * /api/orders/bulk:
 *   post:
 *     summary: Bulk create orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 maxItems: 500
 *                 items:
 *                   type: object
 *                   required:
 *                     - customerId
 *                     - amount
 *                     - paymentMethod
 *                   properties:
 *                     customerId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                       enum: [credit_card, debit_card, upi, net_banking, cash_on_delivery]
 *                     items:
 *                       type: array
 *                     status:
 *                       type: string
 *                       enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *     responses:
 *       201:
 *         description: Orders created successfully
 *       400:
 *         description: Validation error
 */
router.post('/bulk', protect, validateBulkOrders, bulkCreateOrders);

// Add status update route
router.put('/:id/status', protect, validateMongoId, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customerId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const transformedOrder = {
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
    };

    res.json(transformedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.route('/:id')
  .get(protect, validateMongoId, getOrder)
  .put(protect, validateMongoId, validateOrder, updateOrder)
  .delete(protect, validateMongoId, deleteOrder);

module.exports = router;
