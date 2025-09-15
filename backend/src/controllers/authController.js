const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Google OAuth success callback
// @route   GET /api/auth/google/success
// @access  Public
const googleSuccess = async (req, res) => {
  try {
    if (req.user) {
      const token = generateToken(req.user._id);
      
      // Redirect to frontend login page with token
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
    }
  } catch (error) {
    console.error('Google auth success error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
  }
};

// @desc    Google OAuth failure callback
// @route   GET /api/auth/google/failure
// @access  Public
const googleFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=Authentication failed`);
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error logging out'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user stats
// @route   GET /api/auth/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const Campaign = require('../models/Campaign');
    const CommunicationLog = require('../models/CommunicationLog');

    const campaignCount = await Campaign.countDocuments({ createdBy: req.user.id });
    const totalMessagesSent = await CommunicationLog.countDocuments({
      'metadata.campaignCreatedBy': req.user.id,
      status: { $in: ['sent', 'delivered'] }
    });

    const recentCampaigns = await Campaign.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt stats');

    res.status(200).json({
      success: true,
      data: {
        campaignCount,
        totalMessagesSent,
        recentCampaigns,
        joinDate: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Demo login for testing
// @route   POST /api/auth/demo-login
// @access  Public
const demoLogin = async (req, res) => {
  try {
    // Find or create demo user
    let demoUser = await User.findOne({ email: 'demo@example.com' });
    
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin',
        isActive: true
      });
    }

    const token = generateToken(demoUser._id);

    res.status(200).json({
      success: true,
      data: demoUser,
      token
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({
      success: false,
      message: 'Demo login failed'
    });
  }
};

module.exports = {
  getMe,
  googleSuccess,
  googleFailure,
  logout,
  updateProfile,
  getUserStats,
  demoLogin
};
