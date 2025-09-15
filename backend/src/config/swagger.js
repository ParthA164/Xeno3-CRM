const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini CRM Platform API',
      version: '1.0.0',
      description: 'A comprehensive CRM platform with customer segmentation, personalized campaigns, and AI-powered insights',
      contact: {
        name: 'Xeno3 CRM Team',
        email: 'support@xeno3crm.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Customers',
        description: 'Customer management operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Campaigns',
        description: 'Campaign creation and management'
      },
      {
        name: 'AI Features',
        description: 'AI-powered features and insights'
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for external integrations'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { margin: 20px 0; }
  `,
  customSiteTitle: 'Mini CRM Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
