const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  static openaiClient = null;
  static geminiClient = null;
  static useGemini = false;

  static async initialize() {
    try {
      // Check if we should use Gemini based on environment variable
      this.useGemini = process.env.USE_GEMINI === 'true';
      console.log(`AIService initialized with ${this.useGemini ? 'Gemini' : 'OpenAI'} as primary provider`);
      
      // Initialize Gemini if API key is available
      if (process.env.GEMINI_API_KEY) {
        this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Test the API key with a simple request to verify it works
        try {
          const genAI = this.geminiClient;
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model.generateContent("Hello!");
          const response = await result.response;
          console.log('Gemini API key successfully validated');
        } catch (apiError) {
          console.error('Gemini API key validation failed:', apiError.message);
          this.geminiClient = null;
        }
      } else {
        console.log('No Gemini API key provided');
        this.geminiClient = null;
      }
      
      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        // Test the API key with a simple request to verify it works
        try {
          const response = await this.openaiClient.models.list();
          console.log('OpenAI API key successfully validated');
        } catch (apiError) {
          console.error('OpenAI API key validation failed:', apiError.message);
          this.openaiClient = null;
        }
      } else {
        console.log('No OpenAI API key provided');
        this.openaiClient = null;
      }
      
      // Log the status
      if (!this.geminiClient && !this.openaiClient) {
        console.log('AIService will use mock implementations (no valid API keys provided)');
      }
    } catch (error) {
      console.error('Error initializing AIService:', error);
      console.log('AIService will use mock implementations');
      this.geminiClient = null;
      this.openaiClient = null;
    }
  }
  
  // Adapter method for parseNaturalLanguageToRules to maintain compatibility
  static async parseNaturalLanguage(query) {
    try {
      const rules = await this.parseNaturalLanguageToRules(query);
      return { success: true, rules };
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Convert natural language to audience rules
  static async parseNaturalLanguageToRules(query) {
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for natural language parsing');
        const prompt = `
Convert the following natural language query into audience segmentation rules for a CRM system.

Available fields:
- totalSpending (number): Customer's total spending amount
- visits (number): Number of visits/orders
- daysSinceLastVisit (number): Days since last purchase
- registrationDate (date): When customer registered
- segment (string): VIP, Premium, Regular, New
- isActive (boolean): Whether customer is active
- tags (array): Customer tags

Available operators:
- For numbers: >, <, >=, <=, ==, !=
- For strings: ==, !=, contains, not_contains
- For booleans: ==, !=

Logical operators: AND, OR

Query: "${query}"

Return a JSON array of rules in this format:
[
  {
    "field": "totalSpending",
    "operator": ">",
    "value": 10000,
    "logicalOperator": "AND"
  },
  {
    "field": "visits",
    "operator": "<",
    "value": 3
  }
]

Return only valid JSON, no explanations.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        try {
          // Try to extract JSON from the response
          let jsonContent = content;
          // If the response has markdown code blocks, extract JSON from them
          if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
          } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
          }
          
          const rules = JSON.parse(jsonContent);
          return this.validateAndCleanRules(rules);
        } catch (parseError) {
          console.error('Failed to parse Gemini response as JSON:', parseError);
          console.log('Gemini response:', content);
          // Fall back to OpenAI if available, otherwise use mock
          if (this.openaiClient) {
            console.log('Falling back to OpenAI');
            return this.parseNaturalLanguageWithOpenAI(query);
          } else {
            return this.mockParseNaturalLanguageToRules(query);
          }
        }
      } catch (error) {
        console.error('Gemini API error:', error);
        // Fall back to OpenAI if available, otherwise use mock
        if (this.openaiClient) {
          console.log('Falling back to OpenAI due to Gemini error');
          return this.parseNaturalLanguageWithOpenAI(query);
        } else {
          console.log('Falling back to mock implementation');
          return this.mockParseNaturalLanguageToRules(query);
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.parseNaturalLanguageWithOpenAI(query);
    } 
    // Fall back to mock implementation if no AI service is available
    else {
      console.log('No AI service available, using mock implementation');
      return this.mockParseNaturalLanguageToRules(query);
    }
  }
  
  // OpenAI implementation of natural language parsing
  static async parseNaturalLanguageWithOpenAI(query) {
    try {
      console.log('Using OpenAI for natural language parsing');
      const prompt = `
Convert the following natural language query into audience segmentation rules for a CRM system.

Available fields:
- totalSpending (number): Customer's total spending amount
- visits (number): Number of visits/orders
- daysSinceLastVisit (number): Days since last purchase
- registrationDate (date): When customer registered
- segment (string): VIP, Premium, Regular, New
- isActive (boolean): Whether customer is active
- tags (array): Customer tags

Available operators:
- For numbers: >, <, >=, <=, ==, !=
- For strings: ==, !=, contains, not_contains
- For booleans: ==, !=

Logical operators: AND, OR

Query: "${query}"

Return a JSON array of rules in this format:
[
  {
    "field": "totalSpending",
    "operator": ">",
    "value": 10000,
    "logicalOperator": "AND"
  },
  {
    "field": "visits",
    "operator": "<",
    "value": 3
  }
]

Return only valid JSON, no explanations:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in converting natural language to database query rules. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        const rules = JSON.parse(content);
        return this.validateAndCleanRules(rules);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        // Fall back to mock implementation
        return this.mockParseNaturalLanguageToRules(query);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fall back to mock implementation
      return this.mockParseNaturalLanguageToRules(query);
    }
  }
  
  // Mock implementation of natural language parsing that doesn't use the OpenAI API
  static mockParseNaturalLanguageToRules(query) {
    console.log('Using mock natural language parsing for query:', query);
    
    // Extract potential numbers from the query
    const numberMatches = query.match(/\d+/g) || [];
    const numbers = numberMatches.map(n => parseInt(n, 10));
    
    // Analyze the query for patterns
    const queryLower = query.toLowerCase();
    let matchedRules = [];
    
    // Check for spending-related patterns
    if (queryLower.includes('spend') || queryLower.includes('spending') || queryLower.includes('purchase')) {
      const threshold = numbers.length > 0 ? numbers[0] : 5000;
      if (queryLower.includes('more than') || queryLower.includes('greater than') || queryLower.includes('over') || queryLower.includes('>')) {
        matchedRules.push({ field: 'totalSpending', operator: '>', value: threshold.toString() });
      } else if (queryLower.includes('less than') || queryLower.includes('under') || queryLower.includes('<')) {
        matchedRules.push({ field: 'totalSpending', operator: '<', value: threshold.toString() });
      } else {
        matchedRules.push({ field: 'totalSpending', operator: '>', value: threshold.toString() });
      }
    }
    
    // Check for visit-related patterns
    if (queryLower.includes('visit') || queryLower.includes('order') || queryLower.includes('purchase')) {
      const threshold = numbers.length > (queryLower.includes('spend') ? 1 : 0) ? numbers[queryLower.includes('spend') ? 1 : 0] : 5;
      if (queryLower.includes('frequent') || queryLower.includes('many') || queryLower.includes('multiple')) {
        matchedRules.push({ field: 'visits', operator: '>', value: threshold.toString() });
      } else if (queryLower.includes('few') || queryLower.includes('rare')) {
        matchedRules.push({ field: 'visits', operator: '<', value: threshold.toString() });
      }
    }
    
    // Check for recency-related patterns
    if (queryLower.includes('recent') || queryLower.includes('last') || queryLower.includes('latest') || queryLower.includes('new')) {
      const threshold = numbers.length > 0 ? numbers[0] : 30;
      matchedRules.push({ field: 'daysSinceLastVisit', operator: '<', value: threshold.toString() });
    }
    
    // Check for customer segment
    if (queryLower.includes('vip')) {
      matchedRules.push({ field: 'segment', operator: '==', value: 'VIP' });
    } else if (queryLower.includes('premium')) {
      matchedRules.push({ field: 'segment', operator: '==', value: 'Premium' });
    } else if (queryLower.includes('regular')) {
      matchedRules.push({ field: 'segment', operator: '==', value: 'Regular' });
    } else if (queryLower.includes('new customer')) {
      matchedRules.push({ field: 'segment', operator: '==', value: 'New' });
    }
    
    // Check for activity status
    if (queryLower.includes('active')) {
      matchedRules.push({ field: 'isActive', operator: '==', value: 'true' });
    } else if (queryLower.includes('inactive') || queryLower.includes('dormant')) {
      matchedRules.push({ field: 'isActive', operator: '==', value: 'false' });
    }
    
    // Add logical operators
    if (matchedRules.length > 1) {
      const useOr = queryLower.includes(' or ') || queryLower.includes('either');
      for (let i = 0; i < matchedRules.length - 1; i++) {
        matchedRules[i].logicalOperator = useOr ? 'OR' : 'AND';
      }
    }
    
    // Default rule if no patterns matched
    if (matchedRules.length === 0) {
      matchedRules.push({ field: 'isActive', operator: '==', value: 'true' });
    }
    
    console.log('Generated mock rules:', JSON.stringify(matchedRules));
    return matchedRules;
  }

  // Generate message variants with different tones
  static async generateMessageVariants(originalMessage, objective = '') {
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for message variants');
        const prompt = `
Create 3 different variants of this marketing message with different tones.
Original message: "${originalMessage}"
Campaign objective: "${objective}"

Create variants with these tones:
1. Professional and formal
2. Friendly and casual
3. Urgent and compelling

For each variant:
- Keep the core message and offers intact
- Adjust tone and style only
- Maintain personalization placeholders like {name}, {firstName}
- Keep it under 200 characters if possible

Return JSON in this format:
{
  "messageVariants": [
    {
      "text": "variant message here",
      "tone": "professional",
      "score": 85
    }
  ]
}

Return only valid JSON.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Parse the JSON response
        try {
          // Find JSON in the response (in case there's text before or after)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
          }
          
          const jsonResponse = JSON.parse(jsonMatch[0]);
          
          if (!jsonResponse.messageVariants || !Array.isArray(jsonResponse.messageVariants)) {
            throw new Error('Invalid response format from Gemini API');
          }
          
          return jsonResponse;
        } catch (jsonError) {
          console.error('Error parsing Gemini JSON response:', jsonError);
          // Fall back to OpenAI if available, otherwise use mock
          if (this.openaiClient) {
            console.log('Falling back to OpenAI for message variants');
            return this.generateMessageVariantsWithOpenAI(originalMessage, objective);
          } else {
            console.log('Falling back to mock message variants');
            return this.mockGenerateMessageVariants(originalMessage, objective);
          }
        }
      } catch (error) {
        console.error('Gemini API error for message variants:', error);
        // Fall back to OpenAI if available, otherwise use mock
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for message variants');
          return this.generateMessageVariantsWithOpenAI(originalMessage, objective);
        } else {
          console.log('Falling back to mock message variants');
          return this.mockGenerateMessageVariants(originalMessage, objective);
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.generateMessageVariantsWithOpenAI(originalMessage, objective);
    } 
    // Fall back to mock implementation if no AI service is available
    else {
      console.log('No AI service available, using mock message variants');
      return this.mockGenerateMessageVariants(originalMessage, objective);
    }
  }

  // OpenAI implementation of message variants generation
  static async generateMessageVariantsWithOpenAI(originalMessage, objective = '') {
    try {
      console.log('Using OpenAI for message variants');
      const prompt = `
Create 3 different variants of this marketing message with different tones.
Original message: "${originalMessage}"
Campaign objective: "${objective}"

Create variants with these tones:
1. Professional and formal
2. Friendly and casual
3. Urgent and compelling

For each variant:
- Keep the core message and offers intact
- Adjust tone and style only
- Maintain personalization placeholders like {name}, {firstName}
- Keep it under 200 characters if possible

Return JSON in this format:
{
  "messageVariants": [
    {
      "text": "variant message here",
      "tone": "professional",
      "score": 85
    }
  ]
}

Return only valid JSON:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing copywriter. Create engaging message variants while preserving the original intent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        const result = JSON.parse(content);
        return result;
      } catch (parseError) {
        return this.mockGenerateMessageVariants(originalMessage, objective);
      }
    } catch (error) {
      console.error('Error generating message variants with OpenAI:', error);
      return this.mockGenerateMessageVariants(originalMessage, objective);
    }
  }
  
  // Mock implementation for message variants generation
  static mockGenerateMessageVariants(originalMessage, objective = '') {
    console.log('Using mock message variants for:', originalMessage);
    
    return {
      messageVariants: [
        { 
          text: originalMessage, 
          tone: 'original', 
          score: 85 
        },
        { 
          text: `Dear {firstName}, ${originalMessage.replace('Hi {firstName},', '').replace('Hello {firstName}!', '')}`, 
          tone: 'professional', 
          score: 80 
        },
        { 
          text: `Hey {firstName}! ${originalMessage.replace('Hi {firstName},', '').replace('Hello {firstName}!', '')}`, 
          tone: 'friendly', 
          score: 75 
        }
      ]
    };
  }
  
  // Suggest message based on campaign type and audience description
  static async suggestMessage(campaignType, audienceDescription) {
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for message suggestion');
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

Return ONLY the message text, no explanations or other content.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestedMessage = response.text().trim();
        
        if (!suggestedMessage) {
          throw new Error('Empty response from Gemini API');
        }
        
        return suggestedMessage;
      } catch (error) {
        console.error('Gemini API error for message suggestion:', error);
        // Fall back to OpenAI if available, otherwise use mock
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for message suggestion');
          return this.suggestMessageWithOpenAI(campaignType, audienceDescription);
        } else {
          console.log('Falling back to mock message suggestion');
          return this.mockSuggestMessage(campaignType, audienceDescription);
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.suggestMessageWithOpenAI(campaignType, audienceDescription);
    } 
    // Fall back to mock implementation if no AI service is available
    else {
      console.log('No AI service available, using mock message suggestion');
      return this.mockSuggestMessage(campaignType, audienceDescription);
    }
  }

  // OpenAI implementation of message suggestion
  static async suggestMessageWithOpenAI(campaignType, audienceDescription) {
    try {
      console.log('Using OpenAI for message suggestion');
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

      const response = await this.openaiClient.chat.completions.create({
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
        throw new Error('Failed to generate message suggestion with OpenAI');
      }
      
      return suggestedMessage;
    } catch (error) {
      console.error('Error generating message suggestion with OpenAI:', error);
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

  // Generate campaign performance insights
  static async generateCampaignInsights(campaign, analytics) {
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for campaign insights');
        const totalSent = campaign.stats.totalSent || 0;
        const totalDelivered = campaign.stats.totalDelivered || 0;
        const totalFailed = campaign.stats.totalFailed || 0;
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : 0;

        const prompt = `
Analyze this campaign performance data and provide human-readable insights:

Campaign: ${campaign.name}
Audience Size: ${campaign.audienceSize}
Messages Sent: ${totalSent}
Messages Delivered: ${totalDelivered}
Messages Failed: ${totalFailed}
Delivery Rate: ${deliveryRate}%

Status Breakdown:
${analytics.map(stat => `${stat._id}: ${stat.count}`).join('\n')}

Provide insights in this JSON format:
{
  "summary": "Brief overall performance summary",
  "highlights": ["Key positive points"],
  "concerns": ["Areas that need attention"],
  "recommendations": ["Actionable suggestions for improvement"],
  "score": 85
}

Focus on practical insights and actionable recommendations. Return only valid JSON.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          // Find JSON in the response (in case there's text before or after)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
          }
          
          return JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          console.error('Error parsing Gemini JSON response for campaign insights:', jsonError);
          // Fall back to OpenAI if available
          if (this.openaiClient) {
            console.log('Falling back to OpenAI for campaign insights');
            return this.generateCampaignInsightsWithOpenAI(campaign, analytics);
          } else {
            return null;
          }
        }
      } catch (error) {
        console.error('Gemini API error for campaign insights:', error);
        // Fall back to OpenAI if available
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for campaign insights');
          return this.generateCampaignInsightsWithOpenAI(campaign, analytics);
        } else {
          return null;
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.generateCampaignInsightsWithOpenAI(campaign, analytics);
    } 
    // Fall back to null if no AI service is available
    else {
      console.log('No AI service available for campaign insights');
      return null;
    }
  }

  // OpenAI implementation of campaign insights generation
  static async generateCampaignInsightsWithOpenAI(campaign, analytics) {
    try {
      console.log('Using OpenAI for campaign insights');
      const totalSent = campaign.stats.totalSent || 0;
      const totalDelivered = campaign.stats.totalDelivered || 0;
      const totalFailed = campaign.stats.totalFailed || 0;
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : 0;

      const prompt = `
Analyze this campaign performance data and provide human-readable insights:

Campaign: ${campaign.name}
Audience Size: ${campaign.audienceSize}
Messages Sent: ${totalSent}
Messages Delivered: ${totalDelivered}
Messages Failed: ${totalFailed}
Delivery Rate: ${deliveryRate}%

Status Breakdown:
${analytics.map(stat => `${stat._id}: ${stat.count}`).join('\n')}

Provide insights in this JSON format:
{
  "summary": "Brief overall performance summary",
  "highlights": ["Key positive points"],
  "concerns": ["Areas that need attention"],
  "recommendations": ["Actionable suggestions for improvement"],
  "score": 85
}

Focus on practical insights and actionable recommendations. Return only valid JSON:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing analytics expert. Provide clear, actionable insights based on campaign data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return null;
      }
    } catch (error) {
      console.error('Error generating campaign insights with OpenAI:', error);
      return null;
    }
  }

  // Generate audience insights based on segmentation rules
  static async generateAudienceInsights(rules, audienceSize) {
    // Check if we have valid rules
    if (!rules || rules.length === 0) {
      return null;
    }
    
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for audience insights');
        const rulesDescription = rules.map(rule => {
          return `${rule.field} ${rule.operator} ${rule.value}`;
        }).join(` ${rules[0]?.logicalOperator || 'AND'} `);

        const prompt = `
Analyze this audience segmentation and provide insights:

Segmentation Rules: ${rulesDescription}
Audience Size: ${audienceSize} customers

Provide insights about this audience segment in JSON format:
{
  "description": "Human-readable description of this audience",
  "characteristics": ["Key characteristics of this segment"],
  "opportunities": ["Marketing opportunities for this segment"],
  "recommendedMessage": "Suggested message tone/content for this audience"
}

Return only valid JSON.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          // Find JSON in the response (in case there's text before or after)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
          }
          
          return JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          console.error('Error parsing Gemini JSON response for audience insights:', jsonError);
          // Fall back to OpenAI if available
          if (this.openaiClient) {
            console.log('Falling back to OpenAI for audience insights');
            return this.generateAudienceInsightsWithOpenAI(rules, audienceSize);
          } else {
            return null;
          }
        }
      } catch (error) {
        console.error('Gemini API error for audience insights:', error);
        // Fall back to OpenAI if available
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for audience insights');
          return this.generateAudienceInsightsWithOpenAI(rules, audienceSize);
        } else {
          return null;
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.generateAudienceInsightsWithOpenAI(rules, audienceSize);
    } 
    // Fall back to null if no AI service is available
    else {
      console.log('No AI service available for audience insights');
      return null;
    }
  }

  // OpenAI implementation of audience insights generation
  static async generateAudienceInsightsWithOpenAI(rules, audienceSize) {
    try {
      console.log('Using OpenAI for audience insights');
      const rulesDescription = rules.map(rule => {
        return `${rule.field} ${rule.operator} ${rule.value}`;
      }).join(` ${rules[0]?.logicalOperator || 'AND'} `);

      const prompt = `
Analyze this audience segmentation and provide insights:

Segmentation Rules: ${rulesDescription}
Audience Size: ${audienceSize} customers

Provide insights about this audience segment in JSON format:
{
  "description": "Human-readable description of this audience",
  "characteristics": ["Key characteristics of this segment"],
  "opportunities": ["Marketing opportunities for this segment"],
  "recommendedMessage": "Suggested message tone/content for this audience"
}

Return only valid JSON:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a customer segmentation expert. Provide insights about audience segments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return null;
      }
    } catch (error) {
      console.error('Error generating audience insights with OpenAI:', error);
      return null;
    }
  }

  // Suggest optimal send times based on audience and campaign type
  static async suggestOptimalSendTime(audienceRules, messageType = 'email') {
    // Define default response
    const defaultResponse = {
      recommendedTime: '10:00 AM',
      timezone: 'IST',
      reasoning: 'General best practice for email campaigns'
    };
    
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for optimal send time suggestion');
        const prompt = `
Based on the audience segmentation rules and message type, suggest the optimal time to send this campaign:

Audience Rules: ${JSON.stringify(audienceRules)}
Message Type: ${messageType}

Consider:
- Target audience behavior patterns
- Time zone (assume IST - Indian Standard Time)
- Message type effectiveness
- General marketing best practices

Return JSON format:
{
  "recommendedTime": "HH:MM AM/PM",
  "timezone": "IST",
  "reasoning": "Brief explanation",
  "alternativeTime": "HH:MM AM/PM"
}

Return only valid JSON.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          // Find JSON in the response (in case there's text before or after)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
          }
          
          return JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          console.error('Error parsing Gemini JSON response for optimal send time:', jsonError);
          // Fall back to OpenAI if available, otherwise use default response
          if (this.openaiClient) {
            console.log('Falling back to OpenAI for optimal send time');
            return this.suggestOptimalSendTimeWithOpenAI(audienceRules, messageType);
          } else {
            return defaultResponse;
          }
        }
      } catch (error) {
        console.error('Gemini API error for optimal send time:', error);
        // Fall back to OpenAI if available, otherwise use default response
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for optimal send time');
          return this.suggestOptimalSendTimeWithOpenAI(audienceRules, messageType);
        } else {
          return defaultResponse;
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.suggestOptimalSendTimeWithOpenAI(audienceRules, messageType);
    } 
    // Fall back to default response if no AI service is available
    else {
      console.log('No AI service available for optimal send time, using default');
      return defaultResponse;
    }
  }

  // OpenAI implementation of optimal send time suggestion
  static async suggestOptimalSendTimeWithOpenAI(audienceRules, messageType = 'email') {
    try {
      console.log('Using OpenAI for optimal send time suggestion');
      const prompt = `
Based on the audience segmentation rules and message type, suggest the optimal time to send this campaign:

Audience Rules: ${JSON.stringify(audienceRules)}
Message Type: ${messageType}

Consider:
- Target audience behavior patterns
- Time zone (assume IST - Indian Standard Time)
- Message type effectiveness
- General marketing best practices

Return JSON format:
{
  "recommendedTime": "HH:MM AM/PM",
  "timezone": "IST",
  "reasoning": "Brief explanation",
  "alternativeTime": "HH:MM AM/PM"
}

Return only valid JSON:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing timing expert with knowledge of Indian market behavior patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return {
          recommendedTime: '10:00 AM',
          timezone: 'IST',
          reasoning: 'General best practice for email campaigns'
        };
      }
    } catch (error) {
      console.error('Error generating optimal send time with OpenAI:', error);
      return {
        recommendedTime: '10:00 AM',
        timezone: 'IST',
        reasoning: 'General best practice for email campaigns'
      };
    }
  }

  // Clean and validate AI-generated rules
  static validateAndCleanRules(rules) {
    if (!Array.isArray(rules)) {
      throw new Error('Rules must be an array');
    }

    const validFields = ['totalSpending', 'visits', 'daysSinceLastVisit', 'registrationDate', 'segment', 'isActive', 'tags'];
    const validOperators = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains'];
    const validLogicalOperators = ['AND', 'OR'];

    return rules.map((rule, index) => {
      // Validate required fields
      if (!rule.field || !validFields.includes(rule.field)) {
        throw new Error(`Invalid field at rule ${index}: ${rule.field}`);
      }

      if (!rule.operator || !validOperators.includes(rule.operator)) {
        throw new Error(`Invalid operator at rule ${index}: ${rule.operator}`);
      }

      if (rule.value === undefined || rule.value === null) {
        throw new Error(`Missing value at rule ${index}`);
      }

      // Clean the rule
      const cleanRule = {
        field: rule.field,
        operator: rule.operator,
        value: rule.value
      };

      // Add logical operator if not the last rule
      if (index < rules.length - 1) {
        cleanRule.logicalOperator = rule.logicalOperator && validLogicalOperators.includes(rule.logicalOperator) 
          ? rule.logicalOperator 
          : 'AND';
      }

      return cleanRule;
    });
  }

  // Generate sample customer data for testing
  static async generateSampleCustomers(count = 10) {
    // Try using Gemini if it's configured and preferred
    if (this.useGemini && this.geminiClient) {
      try {
        console.log('Using Gemini for sample customer generation');
        const prompt = `
Generate ${count} realistic sample customer records for an Indian e-commerce platform. 

Return a JSON array with this format:
[
  {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+91xxxxxxxxxx",
    "totalSpending": 25000,
    "visits": 5,
    "lastVisit": "2024-01-15",
    "registrationDate": "2023-06-10",
    "isActive": true,
    "tags": ["electronics", "frequent_buyer"],
    "address": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  }
]

Use realistic Indian names, cities, and spending patterns. Vary the data realistically.
Return only valid JSON.`;

        const model = this.geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        try {
          // Find JSON in the response (in case there's text before or after)
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
          }
          
          return JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          console.error('Error parsing Gemini JSON response for sample customers:', jsonError);
          // Fall back to OpenAI if available
          if (this.openaiClient) {
            console.log('Falling back to OpenAI for sample customer generation');
            return this.generateSampleCustomersWithOpenAI(count);
          } else {
            throw new Error('Failed to parse Gemini-generated customer data');
          }
        }
      } catch (error) {
        console.error('Gemini API error for sample customer generation:', error);
        // Fall back to OpenAI if available
        if (this.openaiClient) {
          console.log('Falling back to OpenAI for sample customer generation');
          return this.generateSampleCustomersWithOpenAI(count);
        } else {
          throw new Error('Failed to generate sample customers with Gemini');
        }
      }
    } 
    // Try using OpenAI if Gemini is not preferred or not available
    else if (this.openaiClient) {
      return this.generateSampleCustomersWithOpenAI(count);
    } 
    // Throw error if no AI service is available
    else {
      throw new Error('No AI service available for sample customer generation');
    }
  }

  // OpenAI implementation of sample customer generation
  static async generateSampleCustomersWithOpenAI(count = 10) {
    try {
      console.log('Using OpenAI for sample customer generation');
      const prompt = `
Generate ${count} realistic sample customer records for an Indian e-commerce platform. 

Return a JSON array with this format:
[
  {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+91xxxxxxxxxx",
    "totalSpending": 25000,
    "visits": 5,
    "lastVisit": "2024-01-15",
    "registrationDate": "2023-06-10",
    "isActive": true,
    "tags": ["electronics", "frequent_buyer"],
    "address": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  }
]

Use realistic Indian names, cities, and spending patterns. Vary the data realistically.
Return only valid JSON:`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a data generator that creates realistic sample data for testing purposes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content?.trim();
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        throw new Error('Failed to parse OpenAI-generated customer data');
      }
    } catch (error) {
      console.error('Error generating sample customers with OpenAI:', error);
      throw new Error('Failed to generate sample customers with OpenAI');
    }
  }
}

// Initialize the AI service
AIService.initialize();

module.exports = AIService;
