const express = require('express');
const { protect } = require('../middleware/auth');
const { dataLimiter } = require('../middleware/rateLimiter');
const {
  validateCustomer,
  validateMongoId,
  validateCustomerFilters,
  validateBulkCustomers
} = require('../middleware/validation');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkCreateCustomers,
  getCustomerStats
} = require('../controllers/customerController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         totalSpending:
 *           type: number
 *         visits:
 *           type: number
 *         lastVisit:
 *           type: string
 *           format: date-time
 *         registrationDate:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         address:
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
 *         preferences:
 *           type: object
 *           properties:
 *             emailNotifications:
 *               type: boolean
 *             smsNotifications:
 *               type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with pagination and filtering
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: minSpending
 *         schema:
 *           type: number
 *         description: Minimum total spending
 *       - in: query
 *         name: maxSpending
 *         schema:
 *           type: number
 *         description: Maximum total spending
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
 *         description: Customers retrieved successfully
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
 *                     $ref: '#/components/schemas/Customer'
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
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               totalSpending:
 *                 type: number
 *               visits:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               address:
 *                 type: object
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.route('/')
  .get(protect, dataLimiter, validateCustomerFilters, getCustomers)
  .post(protect, dataLimiter, validateCustomer, createCustomer);

/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
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
 *                     segments:
 *                       type: array
 */
router.get('/stats', protect, getCustomerStats);

/**
 * @swagger
 * /api/customers/bulk:
 *   post:
 *     summary: Bulk create customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customers
 *             properties:
 *               customers:
 *                 type: array
 *                 maxItems: 1000
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - email
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     totalSpending:
 *                       type: number
 *                     visits:
 *                       type: number
 *     responses:
 *       201:
 *         description: Customers created successfully
 *       400:
 *         description: Validation error
 */
router.post('/bulk', protect, validateBulkCustomers, bulkCreateCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get a single customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
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
 *                     customer:
 *                       $ref: '#/components/schemas/Customer'
 *                     orders:
 *                       type: array
 *                     stats:
 *                       type: object
 *       404:
 *         description: Customer not found
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.route('/:id')
  .get(protect, validateMongoId, getCustomer)
  .put(protect, validateMongoId, validateCustomer, updateCustomer)
  .delete(protect, validateMongoId, deleteCustomer);

module.exports = router;
