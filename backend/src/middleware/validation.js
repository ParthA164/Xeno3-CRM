const { body, param, query } = require('express-validator');

// Customer validation rules
const validateCustomer = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('totalSpending')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total spending must be a positive number'),
  
  body('visits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Visits must be a positive integer'),
  
  body('lastVisit')
    .optional()
    .isISO8601()
    .withMessage('Last visit must be a valid date'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address must be less than 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters'),
  
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters')
];

// Order validation rules
const validateOrder = [
  body('customerId')
    .if(body('customerData').not().exists())
    .notEmpty()
    .withMessage('Customer ID is required when customerData is not provided')
    .isMongoId()
    .withMessage('Please provide a valid customer ID'),
  
  body('customerData')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer data is required when customerId is not provided'),
  
  body('customerData.name')
    .if(body('customerData').exists())
    .notEmpty()
    .withMessage('Customer name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters'),
  
  body('customerData.email')
    .if(body('customerData').exists())
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('orderNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Order number must be between 1 and 100 characters'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  
  body('items.*.productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required for each item')
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('items.*.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  
  body('orderDate')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid date'),
  
  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// ID parameter validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Please provide a valid ID')
];

// Query parameter validation for pagination and filtering
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Customer filtering validation
const validateCustomerFilters = [
  ...validatePagination,
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  query('minSpending')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum spending must be a positive number'),
  
  query('maxSpending')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum spending must be a positive number'),
  
  query('minVisits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum visits must be a positive integer'),
  
  query('maxVisits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum visits must be a positive integer')
];

// Order filtering validation
const validateOrderFilters = [
  ...validatePagination,
  
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Customer ID must be a valid MongoDB ID'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  query('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'])
    .withMessage('Invalid payment method')
];

// Bulk operations validation
const validateBulkCustomers = [
  body('customers')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Customers must be an array with 1-1000 items'),
  
  body('customers.*.name')
    .trim()
    .notEmpty()
    .withMessage('Name is required for each customer')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('customers.*.email')
    .isEmail()
    .withMessage('Please provide a valid email for each customer')
    .normalizeEmail()
];

const validateBulkOrders = [
  body('orders')
    .isArray({ min: 1, max: 500 })
    .withMessage('Orders must be an array with 1-500 items'),
  
  body('orders.*.customerId')
    .notEmpty()
    .withMessage('Customer ID is required for each order')
    .isMongoId()
    .withMessage('Please provide a valid customer ID for each order'),
  
  body('orders.*.amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number for each order'),
  
  body('orders.*.paymentMethod')
    .isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'])
    .withMessage('Invalid payment method for each order')
];

module.exports = {
  validateCustomer,
  validateOrder,
  validateMongoId,
  validatePagination,
  validateCustomerFilters,
  validateOrderFilters,
  validateBulkCustomers,
  validateBulkOrders
};
