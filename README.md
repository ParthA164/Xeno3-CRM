# Xeno3 CRM Platform

Xeno3 CRM is a modern customer relationship management platform that helps businesses manage their customer interactions, marketing campaigns, and sales processes effectively. The platform features AI-powered tools for campaign optimization, customer segmentation, and intelligent insights.

![Xeno3 CRM Dashboard](https://via.placeholder.com/800x450?text=Xeno3+CRM+Dashboard)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [AI Capabilities](#ai-capabilities)
- [Known Limitations](#known-limitations)

## ✨ Features

- **Customer Management**: Track customer information, interactions, and purchase history
- **Campaign Management**: Create, schedule, and analyze marketing campaigns
- **Order Tracking**: Monitor customer orders and revenue metrics
- **Dashboard Analytics**: Visualize key performance indicators with interactive charts
- **AI-Powered Tools**: Leverage AI for customer segmentation, campaign optimization, and content generation

## 🏗️ Architecture

Xeno3 CRM follows a modern client-server architecture:

```
                  ┌──────────────┐
                  │   Frontend   │
                  │  React + MUI │
                  └───────┬──────┘
                          │
                          ▼
                  ┌──────────────┐     ┌──────────────┐
                  │   Backend    │     │  AI Services │
┌─────────┐       │ Node.js +    │◄────┤ OpenAI/Gemini│
│ MongoDB │◄─────►│ Express API  │     └──────────────┘
└─────────┘       └───────┬──────┘
                          │
                          ▼
                  ┌──────────────┐
                  │  Third-Party │
                  │   Services   │
                  └──────────────┘
```

- **Frontend**: React.js with Material-UI components for a modern UI
- **Backend**: Node.js with Express.js providing RESTful API endpoints
- **Database**: MongoDB for storing customer data, orders, and campaign information
- **AI Services**: Integration with OpenAI and Google Gemini for AI-powered features
- **Authentication**: JWT-based auth with Google OAuth support

## 🛠️ Technology Stack

### Backend
- **Node.js & Express**: Server runtime and API framework
- **MongoDB**: NoSQL database for data storage
- **Passport.js**: Authentication middleware
- **JWT**: Token-based authentication
- **OpenAI & Google Gemini**: AI services for intelligent features
- **Nodemailer**: Email service integration
- **Swagger**: API documentation

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library
- **React Query**: Data fetching and cache management
- **React Router**: Navigation
- **Chart.js**: Data visualization
- **React Hook Form**: Form handling

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/xeno3-crm.git
   cd xeno3-crm/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   # Server
   PORT=5000
   NODE_ENV=development
   
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   
   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   USE_GEMINI=true
   GEMINI_API_KEY=your_gemini_api_key
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. Seed the database with sample data
   ```bash
   node src/scripts/seedData.js
   ```

5. Start the server
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the development server
   ```bash
   npm start
   ```

5. Access the application at `http://localhost:3000`

## 🤖 AI Capabilities

Xeno3 CRM leverages AI to enhance various aspects of customer relationship management:

### 1. Customer Segmentation
- **Automatic Classification**: AI analyzes customer behavior to categorize them into segments
- **Natural Language Queries**: Use plain English to filter customers (e.g., "Show me customers who spent over $1000 last month")

### 2. Campaign Optimization
- **Message Generation**: AI generates compelling campaign content based on target audience
- **Performance Prediction**: Estimates campaign effectiveness before sending
- **A/B Testing Recommendations**: Suggests variations to test for optimal results

### 3. Insights Generation
- **Customer Behavior Analysis**: Identifies patterns and trends in customer data
- **Next-Best-Action Suggestions**: Recommends follow-up actions for specific customers
- **Revenue Forecasting**: Predicts future revenue based on historical data

### 4. Content Assistance
- **Email Templates**: Generates personalized email templates for different customer segments
- **Response Suggestions**: Recommends responses to customer inquiries

## ⚠️ Known Limitations

1. **AI Integration**: Requires valid API keys for OpenAI or Google Gemini; falls back to mock implementations if unavailable
2. **Performance**: Large datasets may experience slower performance on the dashboard
3. **Mobile Responsiveness**: Some advanced dashboard features work best on desktop devices
4. **Data Privacy**: Demo version uses simulated data; production deployment would require proper data handling policies
5. **Authentication**: For demonstration purposes, the platform uses simplified authentication; production deployments should implement additional security measures

## 📝 Assumptions

1. Users have basic familiarity with CRM concepts
2. The application will be used primarily on desktop devices
3. Internet connectivity is required for all features
4. For demo purposes, all users have access to all features (no role-based restrictions)

---

## 🔒 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Xeno3 CRM Team

## 📣 Acknowledgements

- OpenAI and Google for AI capabilities
- MongoDB for database services
- All open-source libraries used in this project