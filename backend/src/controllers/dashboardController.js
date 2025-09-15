const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Get current date and calculate previous month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total counts
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();

    // Revenue calculations
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Previous month stats for growth calculations
    const prevMonthCustomers = await Customer.countDocuments({
      createdAt: { $gte: startOfPrevMonth, $lt: endOfPrevMonth }
    });
    const prevMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfPrevMonth, $lt: endOfPrevMonth }
    });
    const prevMonthCampaigns = await Campaign.countDocuments({
      createdAt: { $gte: startOfPrevMonth, $lt: endOfPrevMonth }
    });

    const prevMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['confirmed', 'shipped', 'delivered'] },
          createdAt: { $gte: startOfPrevMonth, $lt: endOfPrevMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const prevMonthRevenue = prevMonthRevenueResult[0]?.total || 0;

    // Current month stats
    const currentMonthCustomers = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const currentMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const currentMonthCampaigns = await Campaign.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const currentMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['confirmed', 'shipped', 'delivered'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const currentMonthRevenue = currentMonthRevenueResult[0]?.total || 0;

    // Calculate growth percentages
    const customerGrowth = prevMonthCustomers === 0 ? 100 : 
      ((currentMonthCustomers - prevMonthCustomers) / prevMonthCustomers) * 100;
    const orderGrowth = prevMonthOrders === 0 ? 100 : 
      ((currentMonthOrders - prevMonthOrders) / prevMonthOrders) * 100;
    const revenueGrowth = prevMonthRevenue === 0 ? 100 : 
      ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    const campaignGrowth = prevMonthCampaigns === 0 ? 100 : 
      ((currentMonthCampaigns - prevMonthCampaigns) / prevMonthCampaigns) * 100;

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber amount status createdAt customerId items');

    // Recent campaigns - get the most recent campaigns
    const recentCampaigns = await Campaign.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name status messageType stats createdAt createdBy audienceSize');

    // Recent customers (last 5)
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email segment totalSpent totalSpending createdAt isActive');

    // Monthly revenue for the last 6 months
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'shipped', 'delivered'] },
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format monthly revenue data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyRevenue = monthlyRevenue.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue
    }));

    // Customer segments distribution
    const customerSegments = await Customer.aggregate([
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          segment: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Order status distribution
    const orderStatuses = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Campaign performance - group by status and get counts
    const campaignPerformance = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSent: { $sum: '$stats.totalSent' },
          totalDelivered: { $sum: '$stats.totalDelivered' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalSent: 1,
          totalDelivered: 1,
          _id: 0
        }
      },
      {
        $sort: { status: 1 } // Sort alphabetically by status for consistent order
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Main stats
        totalCustomers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCampaigns,
        
        // Growth percentages
        customerGrowth: Math.round(customerGrowth * 10) / 10,
        orderGrowth: Math.round(orderGrowth * 10) / 10,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        campaignGrowth: Math.round(campaignGrowth * 10) / 10,
        
        // Recent data
        recentOrders,
        recentCampaigns,
        recentCustomers,
        
        // Charts data
        monthlyRevenue: formattedMonthlyRevenue,
        customerSegments,
        orderStatuses,
        campaignPerformance
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

module.exports = {
  getDashboardStats
};
