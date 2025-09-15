import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
  Fade,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Visibility,
  Save,
  Psychology,
  Group,
  Email,
  Sms,
  TrendingUp,
  FilterList,
  AutoAwesome,
  Tune,
} from '@mui/icons-material';
import DragDropRuleBuilder from '../components/audience/DragDropRuleBuilder';
import MessageVariants from '../components/common/MessageVariants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsAPI, AudienceRule, Campaign } from '../utils/api';

interface CampaignForm {
  name: string;
  description: string;
  messageType: 'email' | 'sms' | 'both';
  message: string;
  audienceRules: AudienceRule[];
  naturalLanguageQuery: string;
  status: 'draft' | 'scheduled';
  scheduledAt?: string;
  aiSuggestions?: {
    messageVariants?: Array<{
      text: string;
      tone: string;
      score: number;
    }>;
    audienceInsights?: string;
    performancePrediction?: string;
  };
}

interface AudiencePreview {
  size: number;
  customers: Array<{
    _id: string;
    name: string;
    email: string;
    totalSpending: number;
    segment: string;
  }>;
}

const fieldOptions = [
  { value: 'totalSpending', label: 'Total Spending', type: 'number' },
  { value: 'visits', label: 'Visit Count', type: 'number' },
  { value: 'daysSinceLastVisit', label: 'Days Since Last Visit', type: 'number' },
  { value: 'registrationDate', label: 'Registration Date', type: 'date' },
  { value: 'segment', label: 'Customer Segment', type: 'text' },
  { value: 'isActive', label: 'Is Active', type: 'boolean' },
  { value: 'tags', label: 'Tags', type: 'text' },
];

const operatorOptions = {
  number: [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
    { value: '==', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
  ],
  text: [
    { value: '==', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
  ],
  date: [
    { value: '>', label: 'After' },
    { value: '<', label: 'Before' },
    { value: '>=', label: 'On or after' },
    { value: '<=', label: 'On or before' },
  ],
  boolean: [
    { value: '==', label: 'Is' },
    { value: '!=', label: 'Is not' },
  ],
};

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<CampaignForm>({
    name: '',
    description: '',
    messageType: 'email',
    message: '',
    audienceRules: [],
    naturalLanguageQuery: '',
    status: 'draft',
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preview data
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreview | null>(null);

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Campaign>) => campaignsAPI.createCampaign(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      // Show success message before redirecting
      setSuccessMessage('Campaign created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/campaigns');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Campaign creation error:', error);
      // Show specific error from API if available
      const errorMessage = error.response?.data?.message || 'Failed to create campaign. Please try again.';
      setValidationErrors({
        ...validationErrors,
        submit: errorMessage
      });
    }
  });

  // AI message suggestion mutation
  const suggestMessageMutation = useMutation({
    mutationFn: (data: { campaignType: string; audienceDescription: string }) =>
      campaignsAPI.suggestMessage(data),
    onSuccess: (response) => {
      if (response?.data?.success && response?.data?.data) {
        setFormData(prev => ({ ...prev, message: response?.data?.data || '' }));
      }
      setAiSuggesting(false);
    },
    onError: () => {
      setAiSuggesting(false);
    },
  });

  // Add a new audience rule
  const addRule = () => {
    const newRule: AudienceRule = {
      field: 'totalSpending',
      operator: '>',
      value: '',
      logicalOperator: formData.audienceRules.length > 0 ? 'AND' : undefined,
    };
    setFormData(prev => ({
      ...prev,
      audienceRules: [...prev.audienceRules, newRule],
    }));
  };

  // Remove an audience rule
  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      audienceRules: prev.audienceRules.filter((_, i) => i !== index),
    }));
  };

  // Update a specific rule
  const updateRule = (index: number, field: keyof AudienceRule, value: any) => {
    setFormData(prev => ({
      ...prev,
      audienceRules: prev.audienceRules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  // Preview audience
  const previewAudience = async () => {
    if (!useNaturalLanguage && formData.audienceRules.length === 0) {
      return;
    }
    
    if (useNaturalLanguage && !formData.naturalLanguageQuery.trim()) {
      setValidationErrors({
        ...validationErrors,
        naturalLanguageQuery: 'Please describe your target audience'
      });
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await campaignsAPI.previewAudience({
        audienceRules: useNaturalLanguage ? [] : formData.audienceRules,
        naturalLanguageQuery: useNaturalLanguage ? formData.naturalLanguageQuery : '',
      });

      if (response.data.success && response.data.data) {
        setAudiencePreview({
          size: response.data.data.audienceSize,
          customers: response.data.data.sampleCustomers?.map(c => ({
            _id: c._id,
            name: c.name,
            email: c.email,
            totalSpending: c.totalSpending || 0,
            segment: c.segment || 'Regular',
          })) || [],
        });
        
        // If using natural language, update rules from API response if available
        if (useNaturalLanguage && response.data.data?.rules) {
          setFormData(prev => ({
            ...prev,
            audienceRules: response.data.data?.rules || []
          }));
        }
        
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Preview error:', error);
      // Show error in UI
      setValidationErrors({
        ...validationErrors,
        preview: 'Failed to preview audience. Please try again.'
      });
    }
    setPreviewLoading(false);
  };

  // Generate AI message suggestion
  const suggestMessage = () => {
    if (!audiencePreview) {
      return;
    }

    setAiSuggesting(true);
    
    const audienceDescription = `Target audience of ${audiencePreview.size} customers with ${
      useNaturalLanguage 
        ? `criteria: ${formData.naturalLanguageQuery}`
        : `rules: ${formData.audienceRules.map(rule => 
            `${rule.field} ${rule.operator} ${rule.value}`
          ).join(' AND ')}`
    }`;

    suggestMessageMutation.mutate({
      campaignType: formData.messageType,
      audienceDescription,
    });
  };
  
  // AI message variants suggestion 
  const generateMessageVariants = async () => {
    if (!formData.message || formData.message.trim() === '') {
      setValidationErrors({
        ...validationErrors,
        message: 'Please enter a message first before generating variants'
      });
      return;
    }
    
    setAiSuggesting(true);
    
    try {
      const response = await campaignsAPI.generateMessageVariants(formData.message);
      
      if (response?.data?.success && response?.data?.data?.messageVariants) {
        // Create a messageVariants array if it doesn't exist
        setFormData(prev => ({
          ...prev,
          aiSuggestions: {
            ...(prev.aiSuggestions || {}),
            messageVariants: response?.data?.data?.messageVariants || [],
          }
        }));
      }
    } catch (error) {
      console.error('Error generating message variants:', error);
      setValidationErrors({
        ...validationErrors,
        message: 'Failed to generate message variants. Please try again.'
      });
    } finally {
      setAiSuggesting(false);
    }
  };

  // Form validation
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message content is required';
    }
    
    if (formData.status === 'scheduled' && !formData.scheduledAt) {
      errors.scheduledAt = 'Schedule time is required for scheduled campaigns';
    }
    
    if (useNaturalLanguage && !formData.naturalLanguageQuery.trim()) {
      errors.naturalLanguageQuery = 'Please describe your target audience';
    }
    
    if (!useNaturalLanguage && formData.audienceRules.length === 0) {
      errors.audienceRules = 'Please add at least one audience rule';
    }
    
    if (!useNaturalLanguage && formData.audienceRules.some(rule => rule.value === '')) {
      errors.audienceRuleValues = 'All rule values must be filled';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      // If validation fails, show alert
      return;
    }
    
    const campaignData = {
      name: formData.name,
      description: formData.description,
      messageType: formData.messageType,
      message: formData.message,
      audienceRules: useNaturalLanguage ? [] : formData.audienceRules,
      naturalLanguageQuery: useNaturalLanguage ? formData.naturalLanguageQuery : '',
      audienceSize: audiencePreview?.size || 0,
      status: formData.status,
      scheduledAt: formData.scheduledAt,
    };

    createMutation.mutate(campaignData);
  };

  // Get operators for field type
  const getOperatorsForField = (fieldName: string) => {
    const field = fieldOptions.find(f => f.value === fieldName);
    return operatorOptions[field?.type as keyof typeof operatorOptions] || operatorOptions.text;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Campaign
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Design targeted campaigns with AI-powered segmentation and personalized messaging
        </Typography>
      </Box>

      {/* Success message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* Form submission error */}
      {validationErrors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {validationErrors.submit}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Form */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom>
                Campaign Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  required
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Message Type</InputLabel>
                    <Select
                      value={formData.messageType}
                      label="Message Type"
                      onChange={(e) => setFormData(prev => ({ ...prev, messageType: e.target.value as any }))}
                    >
                      <MenuItem value="email">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email /> Email
                        </Box>
                      </MenuItem>
                      <MenuItem value="sms">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Sms /> SMS
                        </Box>
                      </MenuItem>
                      <MenuItem value="both">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email /><Sms /> Both
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Audience Segmentation */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Audience Segmentation
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useNaturalLanguage}
                        onChange={(e) => setUseNaturalLanguage(e.target.checked)}
                      />
                    }
                    label="Use Natural Language"
                  />
                </Box>

                {useNaturalLanguage ? (
                  /* Natural Language Query */
                  <Box>
                    <TextField
                      fullWidth
                      label="Describe your target audience in natural language"
                      placeholder="e.g., High-value customers who spent more than $500 in the last 3 months"
                      multiline
                      rows={3}
                      value={formData.naturalLanguageQuery}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, naturalLanguageQuery: e.target.value }));
                        if (validationErrors.naturalLanguageQuery) {
                          setValidationErrors(prev => ({ ...prev, naturalLanguageQuery: '' }));
                        }
                      }}
                      error={!!validationErrors.naturalLanguageQuery}
                      helperText={validationErrors.naturalLanguageQuery}
                      sx={{ mb: 2 }}
                    />
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Our AI will automatically convert your description into precise audience rules.
                      </Typography>
                    </Alert>
                  </Box>
                ) : (
                  /* Rule Builder */
                  <DragDropRuleBuilder
                    rules={formData.audienceRules}
                    fieldOptions={fieldOptions}
                    operatorOptions={operatorOptions}
                    updateRule={updateRule}
                    removeRule={removeRule}
                    addRule={addRule}
                    setRules={(rules) => setFormData(prev => ({ ...prev, audienceRules: rules }))}
                    validationError={!!validationErrors.audienceRules || !!validationErrors.audienceRuleValues}
                    validationMessage={validationErrors.audienceRules}
                  />
                )}

                {/* Preview Button */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    startIcon={previewLoading ? <CircularProgress size={16} /> : <Visibility />}
                    onClick={previewAudience}
                    variant="contained"
                    disabled={previewLoading || (formData.audienceRules.length === 0 && !formData.naturalLanguageQuery)}
                  >
                    Preview Audience
                  </Button>
                  
                  {audiencePreview && (
                    <Chip
                      icon={<Group />}
                      label={`${audiencePreview.size} customers`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Message Content */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Message Content
                  </Typography>
                  <Box>
                    <Button
                      startIcon={<AutoAwesome />}
                      onClick={generateMessageVariants}
                      variant="outlined"
                      disabled={!formData.message || formData.message.trim() === '' || aiSuggesting}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Generate Variants
                    </Button>
                    <Button
                      startIcon={aiSuggesting ? <CircularProgress size={16} /> : <Psychology />}
                      onClick={suggestMessage}
                      variant="outlined"
                      disabled={!audiencePreview || aiSuggesting}
                      size="small"
                    >
                      AI Suggest
                    </Button>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Message Content"
                  multiline
                  rows={6}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, message: e.target.value }));
                    if (validationErrors.message) {
                      setValidationErrors(prev => ({ ...prev, message: '' }));
                    }
                  }}
                  placeholder="Write your campaign message here..."
                  required
                  error={!!validationErrors.message}
                  helperText={validationErrors.message}
                />

                {/* Message Variants */}
                {formData.aiSuggestions?.messageVariants && formData.aiSuggestions.messageVariants.length > 0 && (
                  <MessageVariants 
                    variants={formData.aiSuggestions.messageVariants} 
                    onSelectVariant={(text) => setFormData(prev => ({ ...prev, message: text }))} 
                  />
                )}

                {/* Audience Insights */}
                {formData.aiSuggestions?.audienceInsights && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Audience Insight:</Typography>
                    <Typography variant="body2">{formData.aiSuggestions.audienceInsights}</Typography>
                  </Alert>
                )}
              </Box>

              {/* Schedule */}
              {formData.status === 'scheduled' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Schedule
                  </Typography>
                  <TextField
                    type="datetime-local"
                    label="Scheduled Time"
                    value={formData.scheduledAt || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, scheduledAt: e.target.value }));
                      if (validationErrors.scheduledAt) {
                        setValidationErrors(prev => ({ ...prev, scheduledAt: '' }));
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    error={!!validationErrors.scheduledAt}
                    helperText={validationErrors.scheduledAt}
                    fullWidth
                  />
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', p: 3 }}>
              <Button
                onClick={() => navigate('/campaigns')}
                variant="outlined"
              >
                Cancel
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={!formData.name || !formData.message || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </Button>
              </Box>
            </CardActions>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', lg: '300px' }, flexShrink: 0 }}>
          {/* Audience Preview */}
          {showPreview && audiencePreview && (
            <Fade in={showPreview}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Audience Preview
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Group sx={{ mr: 1 }} color="primary" />
                    <Typography variant="h4" color="primary">
                      {audiencePreview.size.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      customers
                    </Typography>
                  </Box>

                  {audiencePreview.customers.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Sample Customers:
                      </Typography>
                      <List dense>
                        {audiencePreview.customers.slice(0, 5).map((customer) => (
                          <ListItem key={customer._id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={customer.name}
                              secondary={`${customer.email} • $${customer.totalSpending}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                      {audiencePreview.customers.length > 5 && (
                        <Typography variant="caption" color="textSecondary">
                          +{audiencePreview.customers.length - 5} more customers
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Tips Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campaign Tips
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Personalization"
                    secondary="Use customer data to create personalized messages"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FilterList color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Segmentation"
                    secondary="Narrow your audience for better engagement"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Psychology color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="AI Suggestions"
                    secondary="Let AI help optimize your message content"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateCampaign;
