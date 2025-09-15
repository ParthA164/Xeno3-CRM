const { validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const CommunicationLog = require('../models/CommunicationLog');
const AudienceSegmentationService = require('../services/audienceService');
const VendorService = require('../services/vendorService');
const AIService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all campaigns with pagination and filtering
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query - don't filter by creator for demo purposes
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id
      // Removed createdBy filter to allow access to all campaigns for demo purposes
    })
    .populate('createdBy', 'name email')
    .select('-__v');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get campaign communication logs
    const logs = await CommunicationLog.find({ campaignId: campaign._id })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: {
        campaign,
        logs
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Preview audience size for campaign rules
// @route   POST /api/campaigns/preview
// @access  Private
const previewAudience = async (req, res) => {
  try {
    const { audienceRules, naturalLanguageQuery } = req.body;

    // Handle natural language query if provided
    let rules = audienceRules;
    let parsedRules = [];
    
    if (naturalLanguageQuery && naturalLanguageQuery.trim()) {
      try {
        // Parse natural language query using AI service
        const nlpResponse = await AIService.parseNaturalLanguage(naturalLanguageQuery);
        parsedRules = nlpResponse.rules || [];
        
        // Use parsed rules if available
        if (parsedRules.length > 0) {
          rules = parsedRules;
        }
      } catch (nlpError) {
        console.error('Natural language parsing error:', nlpError);
        // Continue with empty rules if parsing fails
      }
    }

    if (!rules || rules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Audience rules are required'
      });
    }

    // Validate rules
    AudienceSegmentationService.validateRules(rules);

    // Get audience count
    const audienceSize = await AudienceSegmentationService.getAudienceCount(rules);

    // Get sample customers (first 5)
    const sampleCustomers = await AudienceSegmentationService.getAudience(rules, 5);

    res.status(200).json({
      success: true,
      data: {
        audienceSize,
        sampleCustomers,
        rules: parsedRules.length > 0 ? parsedRules : rules,
        estimatedCost: audienceSize * 0.1, // Assuming ₹0.10 per message
        estimatedDeliveryTime: Math.ceil(audienceSize / 100) // 100 messages per minute
      }
    });
  } catch (error) {
    console.error('Preview audience error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const campaignData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Handle natural language query if provided
    if (campaignData.naturalLanguageQuery && campaignData.naturalLanguageQuery.trim()) {
      try {
        // Parse natural language query using AI service
        const nlpResponse = await AIService.parseNaturalLanguage(campaignData.naturalLanguageQuery);
        if (nlpResponse && nlpResponse.rules && nlpResponse.rules.length > 0) {
          campaignData.audienceRules = nlpResponse.rules;
        }
      } catch (nlpError) {
        console.error('Natural language parsing error:', nlpError);
        // If no audience rules provided or NLP failed, return error
        if (!campaignData.audienceRules || campaignData.audienceRules.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Failed to parse audience from natural language query. Please provide specific audience rules instead.'
          });
        }
      }
    }

    // Validate audience rules
    if (campaignData.audienceRules && campaignData.audienceRules.length > 0) {
      AudienceSegmentationService.validateRules(campaignData.audienceRules);
      
      // Calculate audience size
      campaignData.audienceSize = await AudienceSegmentationService.getAudienceCount(campaignData.audienceRules);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Audience rules are required'
      });
    }

    // Get AI suggestions if enabled
    if (campaignData.message && process.env.OPENAI_API_KEY) {
      try {
        // Generate message variants
        const aiSuggestions = await AIService.generateMessageVariants(campaignData.message);
        
        // Generate audience insights if we have audience rules
        let audienceInsights = '';
        if (campaignData.audienceRules && campaignData.audienceRules.length > 0) {
          const audienceDescription = campaignData.naturalLanguageQuery || 
            campaignData.audienceRules.map(rule => 
              `${rule.field} ${rule.operator} ${rule.value}`
            ).join(' AND ');
            
          try {
            const insightPrompt = `
Analyze this audience segment and provide a brief insight about their characteristics and behavior:

Audience size: ${campaignData.audienceSize}
Audience criteria: ${audienceDescription}

Keep it concise (max 2-3 sentences):`;

            if (AIService.client) {
              const insightResponse = await AIService.client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert marketing analyst who can provide brief, insightful descriptions of customer segments.'
                  },
                  {
                    role: 'user',
                    content: insightPrompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 150
              });
              
              audienceInsights = insightResponse.choices[0]?.message?.content?.trim() || '';
            }
          } catch (insightError) {
            console.error('Audience insights error:', insightError);
            // Continue without insights
          }
        }
        
        // Add audience insights to AI suggestions
        campaignData.aiSuggestions = {
          ...aiSuggestions,
          audienceInsights
        };
      } catch (aiError) {
        console.error('AI suggestions error:', aiError);
        // Continue without AI suggestions
      }
    }

    const campaign = new Campaign(campaignData);
    await campaign.save();

    // Populate user data for response
    await campaign.populate('createdBy', 'name email');

    // If campaign should be sent immediately
    if (campaignData.status === 'sending' || campaignData.scheduledAt) {
      // Start campaign delivery process (async)
      setImmediate(() => startCampaignDelivery(campaign._id));
    }

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
const updateCampaign = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id
      // Removed createdBy filter for demo purposes
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be updated
    if (['sending', 'sent', 'completed'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update campaign that is already sent or being sent'
      });
    }

    // Validate audience rules if provided
    if (req.body.audienceRules && req.body.audienceRules.length > 0) {
      AudienceSegmentationService.validateRules(req.body.audienceRules);
      
      // Recalculate audience size
      req.body.audienceSize = await AudienceSegmentationService.getAudienceCount(req.body.audienceRules);
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').select('-__v');

    res.status(200).json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id
      // Removed createdBy filter for demo purposes
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be deleted
    if (['sending', 'sent'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign that is already sent or being sent'
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send/Start campaign
// @route   POST /api/campaigns/:id/send
// @access  Private
const sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id
      // Removed createdBy filter for demo purposes
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be sent
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Campaign cannot be sent in its current status'
      });
    }

    if (!campaign.audienceRules || campaign.audienceRules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campaign must have audience rules defined'
      });
    }

    if (!campaign.message) {
      return res.status(400).json({
        success: false,
        message: 'Campaign must have a message'
      });
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await campaign.save();

    // Start campaign delivery process (async)
    setImmediate(() => startCampaignDelivery(campaign._id));

    res.status(200).json({
      success: true,
      message: 'Campaign delivery started',
      data: campaign
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Pause campaign
// @route   POST /api/campaigns/:id/pause
// @access  Private
const pauseCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id
      // Removed createdBy filter for demo purposes
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Only sending campaigns can be paused'
      });
    }

    campaign.status = 'paused';
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign paused',
      data: campaign
    });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get campaign analytics
// @route   GET /api/campaigns/:id/analytics
// @access  Private
const getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get detailed analytics
    const analytics = await CommunicationLog.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          messageType: { $first: '$messageType' }
        }
      }
    ]);

    const timeAnalytics = await CommunicationLog.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]);

    // Generate AI insights if available
    let aiInsights = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        aiInsights = await AIService.generateCampaignInsights(campaign, analytics);
      } catch (aiError) {
        console.error('AI insights error:', aiError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        campaign: {
          name: campaign.name,
          status: campaign.status,
          audienceSize: campaign.audienceSize,
          stats: campaign.stats
        },
        statusBreakdown: analytics,
        timeAnalytics,
        aiInsights
      }
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to start campaign delivery
async function startCampaignDelivery(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== 'sending') {
      return;
    }

    // Get audience
    const audience = await AudienceSegmentationService.getAudience(campaign.audienceRules);
    
    if (audience.length === 0) {
      campaign.status = 'completed';
      await campaign.save();
      return;
    }

    // Send messages to each customer
    for (const customer of audience) {
      try {
        // Create communication log entry
        const messageId = uuidv4();
        const personalizedMessage = personalizeMessage(campaign.message, customer);
        
        const logEntry = new CommunicationLog({
          campaignId: campaign._id,
          customerId: customer._id,
          messageId,
          messageType: campaign.messageType || 'email',
          recipient: {
            email: customer.email,
            phone: customer.phone
          },
          message: personalizedMessage,
          status: 'pending',
          metadata: {
            campaignName: campaign.name
          }
        });

        await logEntry.save();

        // Send via vendor API
        await VendorService.sendMessage({
          messageId,
          recipient: customer.email,
          message: personalizedMessage,
          type: campaign.messageType || 'email'
        });

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error sending message to ${customer.email}:`, error);
      }
    }

    // Update campaign status
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

  } catch (error) {
    console.error('Campaign delivery error:', error);
    
    // Update campaign status to failed
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.status = 'failed';
      await campaign.save();
    }
  }
}

// Helper function to personalize message
function personalizeMessage(template, customer) {
  return template
    .replace(/\{name\}/g, customer.name)
    .replace(/\{firstName\}/g, customer.name.split(' ')[0])
    .replace(/\{email\}/g, customer.email)
    .replace(/\{totalSpending\}/g, customer.totalSpending.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }))
    .replace(/\{visits\}/g, customer.visits)
    .replace(/\{segment\}/g, customer.totalSpending >= 50000 ? 'VIP' : customer.totalSpending >= 20000 ? 'Premium' : customer.totalSpending >= 5000 ? 'Regular' : 'New');
}

module.exports = {
  getCampaigns,
  getCampaign,
  previewAudience,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  pauseCampaign,
  getCampaignAnalytics
};
