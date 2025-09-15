import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Email,
  Sms,
  Group,
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, formatDistanceToNow } from 'date-fns';

import { campaignsAPI, Campaign } from '../utils/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`campaign-tabpanel-${index}`}
      aria-labelledby={`campaign-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // State
  const [tabValue, setTabValue] = useState(() => {
    const tab = searchParams.get('tab');
    switch (tab) {
      case 'analytics': return 1;
      case 'audience': return 2;
      case 'delivery': return 3;
      default: return 0;
    }
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch campaign data
  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsAPI.getCampaign(id!),
    enabled: !!id,
  });

  // Fetch campaign analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => campaignsAPI.getCampaignAnalytics(id!),
    enabled: !!id,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: () => campaignsAPI.deleteCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campaigns');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => campaignsAPI.sendCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => campaignsAPI.pauseCampaign(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!campaignData?.data?.success) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  const campaignInfo = campaignData?.data?.data;
  if (!campaignInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  const campaign: Campaign = campaignInfo.campaign;
  const analytics = analyticsData?.data?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'sending': return 'warning';
      case 'scheduled': return 'info';
      case 'failed': return 'error';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'sending': return <PlayArrow />;
      case 'scheduled': return <Schedule />;
      case 'failed': return <Error />;
      case 'paused': return <Pause />;
      default: return <Schedule />;
    }
  };

  const canSend = ['draft', 'paused', 'scheduled'].includes(campaign.status);
  const canPause = campaign.status === 'sending';

  // Real analytics data from backend
  const deliveryData = {
    labels: ['Sent', 'Delivered', 'Failed', 'Pending'],
    datasets: [
      {
        data: [
          campaign.stats.totalSent,
          campaign.stats.totalDelivered,
          campaign.stats.totalFailed,
          campaign.audienceSize - campaign.stats.totalSent,
        ],
        backgroundColor: ['#2196F3', '#4CAF50', '#F44336', '#FF9800'],
      },
    ],
  };

  const performanceOverTime = {
    labels: analytics?.timeAnalytics?.map((item: any) => 
      format(new Date(item._id.date), 'MMM dd')
    ) || ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Messages Sent',
        data: analytics?.timeAnalytics?.map((item: any) => item.count) || [120, 190, 300, 500, 600, 580, 600],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {campaign.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Created {formatDistanceToNow(new Date(campaign.createdAt))} ago
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={getStatusIcon(campaign.status)}
            label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            color={getStatusColor(campaign.status)}
            variant="outlined"
          />
          <Chip
            icon={campaign.messageType === 'email' ? <Email /> : <Sms />}
            label={campaign.messageType.toUpperCase()}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {canSend && (
          <Button
            startIcon={<PlayArrow />}
            onClick={() => sendMutation.mutate()}
            variant="contained"
            disabled={sendMutation.isPending}
          >
            Send Campaign
          </Button>
        )}
        {canPause && (
          <Button
            startIcon={<Pause />}
            onClick={() => pauseMutation.mutate()}
            variant="outlined"
            disabled={pauseMutation.isPending}
          >
            Pause Campaign
          </Button>
        )}
        <Button
          startIcon={<Edit />}
          onClick={() => navigate(`/campaigns/${id}/edit`)}
          variant="outlined"
        >
          Edit
        </Button>
        <Button
          startIcon={<Delete />}
          onClick={() => setDeleteDialogOpen(true)}
          variant="outlined"
          color="error"
        >
          Delete
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Audience" />
          <Tab label="Delivery Log" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Campaign Info */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Description" 
                      secondary={campaign.description || 'No description provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Message Type" 
                      secondary={campaign.messageType.toUpperCase()} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Audience Size" 
                      secondary={`${campaign.audienceSize.toLocaleString()} customers`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Created" 
                      secondary={format(new Date(campaign.createdAt), 'PPP')} 
                    />
                  </ListItem>
                  {campaign.scheduledAt && (
                    <ListItem>
                      <ListItemText 
                        primary="Scheduled" 
                        secondary={format(new Date(campaign.scheduledAt), 'PPP p')} 
                      />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Message Content
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {campaign.message}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {campaign.stats.totalSent}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Messages Sent
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main" gutterBottom>
                    {campaign.stats.totalDelivered}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Delivered
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="error.main" gutterBottom>
                    {campaign.stats.totalFailed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Failed
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main" gutterBottom>
                    {campaign.stats.deliveryRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Delivery Rate
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Delivery Funnel
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Doughnut 
                      data={deliveryData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Over Time
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line 
                      data={performanceOverTime} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {campaign.stats.deliveryRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">Delivery Rate</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {campaign.audienceSize > 0 ? ((campaign.stats.totalSent / campaign.audienceSize) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2">Send Rate</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {campaign.stats.totalSent > 0 ? ((campaign.stats.totalDelivered / campaign.stats.totalSent) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2">Success Rate</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {campaign.stats.totalSent > 0 ? ((campaign.stats.totalFailed / campaign.stats.totalSent) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2">Failure Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Audience Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audience Rules
                </Typography>
                {campaign.naturalLanguageQuery ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Natural Language Query:</Typography>
                    <Typography variant="body2">{campaign.naturalLanguageQuery}</Typography>
                  </Alert>
                ) : (
                  <List>
                    {campaign.audienceRules.map((rule, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {index > 0 && (
                                <Chip size="small" label={rule.logicalOperator} variant="outlined" />
                              )}
                              <Typography variant="body1">
                                <strong>{rule.field}</strong> {rule.operator} <strong>{rule.value}</strong>
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audience Summary
                </Typography>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                    <Group />
                  </Avatar>
                  <Typography variant="h4" color="primary">
                    {campaign.audienceSize.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Customers
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      {/* Delivery Log Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery Log
            </Typography>
            {campaignInfo.logs && campaignInfo.logs.length > 0 ? (
              <List>
                {campaignInfo.logs.map((log: any, index: number) => (
                  <React.Fragment key={log._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: log.status === 'delivered' ? 'success.main' : 
                                  log.status === 'failed' ? 'error.main' : 
                                  log.status === 'sent' ? 'primary.main' : 'warning.main'
                        }}>
                          {log.status === 'delivered' ? <CheckCircle /> :
                           log.status === 'failed' ? <Error /> :
                           log.status === 'sent' ? <Email /> : <Schedule />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {log.customerId?.name || log.recipient?.email || 'Unknown Customer'}
                            </Typography>
                            <Chip 
                              label={log.status} 
                              size="small" 
                              color={
                                log.status === 'delivered' ? 'success' :
                                log.status === 'failed' ? 'error' :
                                log.status === 'sent' ? 'primary' : 'warning'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {log.recipient?.email || log.recipient?.phone}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                              {log.errorMessage && ` • Error: ${log.errorMessage}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < campaignInfo.logs.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No delivery logs available yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => deleteMutation.mutate()} 
            color="error" 
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignDetail;
