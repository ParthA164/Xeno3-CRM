const Settings = require('../models/Settings');
const User = require('../models/User');

// Get user settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let settings = await Settings.findOne({ userId });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({ userId });
      await settings.save();
    }
    
    res.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Validate that the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      // Create new settings if they don't exist
      settings = new Settings({ userId, ...updateData });
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && updateData[key] !== null) {
          settings[key] = { ...settings[key], ...updateData[key] };
        } else {
          settings[key] = updateData[key];
        }
      });
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// Reset settings to default
const resetSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete existing settings
    await Settings.findOneAndDelete({ userId });
    
    // Create new default settings
    const defaultSettings = new Settings({ userId });
    await defaultSettings.save();
    
    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error.message
    });
  }
};

// Update specific setting section
const updateSettingSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { section } = req.params;
    const updateData = req.body;
    
    const validSections = ['notifications', 'privacy', 'apiConfig', 'display', 'integrations', 'security'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }
    
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      settings = new Settings({ userId });
    }
    
    settings[section] = { ...settings[section], ...updateData };
    await settings.save();
    
    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      data: settings
    });
  } catch (error) {
    console.error(`Error updating ${req.params.section} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Error updating ${req.params.section} settings`,
      error: error.message
    });
  }
};

// Generate new API key
const generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate a random API key
    const apiKey = require('crypto').randomBytes(32).toString('hex');
    
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      settings = new Settings({ userId });
    }
    
    settings.apiConfig.apiKey = apiKey;
    await settings.save();
    
    res.json({
      success: true,
      message: 'API key generated successfully',
      data: { apiKey }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating API key',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
  updateSettingSection,
  generateApiKey
};
