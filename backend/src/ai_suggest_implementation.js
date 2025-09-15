// Implementation of new suggestMessage method in AIService

// Add this method to the AIService class in aiService.js
static async suggestMessage(campaignType, audienceDescription) {
  if (!this.client) {
    return this.mockSuggestMessage(campaignType, audienceDescription);
  }

  try {
    const prompt = `
Create a compelling marketing message for a ${campaignType} campaign.

Target audience: ${audienceDescription}

Message format requirements:
- Should be concise (max 150-200 characters for SMS, slightly longer for email)
- Should include a clear call-to-action
- Should be personalized where appropriate (use {firstName} or {name} placeholder)
- Should have an engaging tone appropriate for the audience
- Should avoid overly salesy language
- Should convey value to the customer

Campaign type: ${campaignType}

Return ONLY the message text, no explanations:`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter specializing in creating high-converting messages for email and SMS campaigns. You know how to craft messages that engage customers and drive action.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const suggestedMessage = response.choices[0]?.message?.content?.trim();
    
    if (!suggestedMessage) {
      throw new Error('Failed to generate message suggestion');
    }
    
    return suggestedMessage;

  } catch (error) {
    console.error('Error generating message suggestion:', error);
    return this.mockSuggestMessage(campaignType, audienceDescription);
  }
}

// Fallback mock implementation for message suggestions
static mockSuggestMessage(campaignType, audienceDescription) {
  console.log('Using mock message suggestion for:', campaignType, audienceDescription);
  
  const templates = {
    email: [
      "Hi {firstName}, we noticed you might be interested in our latest offers. Check them out today and save 15% on your next purchase!",
      "Dear {firstName}, it's been a while! We've got some exciting new products we think you'll love. Visit our website to learn more.",
      "Hello {firstName}! As a valued customer, we're giving you early access to our seasonal sale. Use code SPECIAL15 for an extra discount!"
    ],
    sms: [
      "Hi {firstName}! 15% off your next purchase with code SAVE15. Valid for 48hrs only. Shop now!",
      "{firstName}, we miss you! Come back and enjoy special offers tailored just for you. Visit our site today!",
      "Exclusive offer for you {firstName}! Shop today and get free shipping on all orders. Limited time only!"
    ],
    both: [
      "Hi {firstName}, thank you for being our customer! We've prepared special offers just for you. Check your inbox or visit our website today!",
      "Hello {firstName}! Don't miss out on our biggest sale of the season. Save up to 25% on selected items for a limited time!",
      "Dear {firstName}, we appreciate your loyalty! Here's a special discount code THANKS20 valid for your next purchase."
    ]
  };
  
  // Select a template based on campaign type
  const messageType = campaignType in templates ? campaignType : 'email';
  const templateIndex = Math.floor(Math.random() * templates[messageType].length);
  
  // Customize based on audience description
  let message = templates[messageType][templateIndex];
  
  // Add audience-specific customization
  if (audienceDescription.toLowerCase().includes('vip') || audienceDescription.toLowerCase().includes('premium')) {
    message = message.replace('valued customer', 'premium member');
    message = message.replace('15%', '25%');
    message = message.replace('SAVE15', 'VIP25');
  }
  
  if (audienceDescription.toLowerCase().includes('inactive') || audienceDescription.toLowerCase().includes('haven\'t')) {
    message = message.replace('As a valued customer', 'We miss you! As a previous customer');
    message += ' We\'d love to see you back!';
  }
  
  return message;
}