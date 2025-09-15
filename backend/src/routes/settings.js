const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings,
  updateSettingSection,
  generateApiKey
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// All settings routes require authentication
router.use(protect);

// Get user settings
router.get('/', getSettings);

// Update all settings
router.put('/', updateSettings);

// Reset settings to default
router.post('/reset', resetSettings);

// Update specific setting section
router.put('/:section', updateSettingSection);

// Generate new API key
router.post('/generate-api-key', generateApiKey);

module.exports = router;
