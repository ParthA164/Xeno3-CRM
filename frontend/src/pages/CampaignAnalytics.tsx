import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Divider,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Email,
  Sms,
  People,
  CheckCircle,
  Error,
  Schedule,
  Analytics,
  Campaign,
  Timeline,
  BarChart,
  PieChart,
  Download,
  FilterList,
} from '@mui/icons-material';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import { campaignsAPI, dashboardAPI } from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CampaignAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('7d');
  const [campaignType, setCampaignType] = useState('all');

  // Fetch analytics data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns-analytics', dateRange, campaignType],
    queryFn: () => campaignsAPI.getCampaigns({
      limit: 100,
      ...(campaignType !== 'all' && { messageType: campaignType }),
    }),
  });

  const dashboardStats = dashboardData?.data?.data;
  const campaigns = campaignsData?.data?.data || [];

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '1d':
        return { start: startOfDay(now), end: endOfDay(now) };
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30d':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90d':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      default:
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    }
  };

  // Filter campaigns by date range
  const filteredCampaigns = campaigns.filter(campaign => {
    const campaignDate = new Date(campaign.createdAt);
    const { start, end } = getDateRange();
    return campaignDate >= start && campaignDate <= end;
  });

  // Calculate metrics
  const totalCampaigns = filteredCampaigns.length;
  const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.stats?.totalSent || 0), 0);
  const totalDelivered = filteredCampaigns.reduce((sum, c) => sum + (c.stats?.totalDelivered || 0), 0);
  const totalFailed = filteredCampaigns.reduce((sum, c) => sum + (c.stats?.totalFailed || 0), 0);
  const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

  // Campaign performance over time
  const performanceOverTime = {
    labels: Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'MMM dd');
    }),
    datasets: [
      {
        label: 'Campaigns Sent',
        data: Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return filteredCampaigns.filter(c => 
            format(new Date(c.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          ).length;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Messages Delivered',
        data: Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return filteredCampaigns
            .filter(c => format(new Date(c.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
            .reduce((sum, c) => sum + (c.stats?.totalDelivered || 0), 0);
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Campaign status distribution
  const statusDistribution = {
    labels: ['Completed', 'Sending', 'Draft', 'Failed', 'Paused'],
    datasets: [
      {
        data: [
          filteredCampaigns.filter(c => c.status === 'completed').length,
          filteredCampaigns.filter(c => c.status === 'sending').length,
          filteredCampaigns.filter(c => c.status === 'draft').length,
          filteredCampaigns.filter(c => c.status === 'failed').length,
          filteredCampaigns.filter(c => c.status === 'paused').length,
        ],
        backgroundColor: [
          '#4CAF50',
          '#FF9800',
          '#2196F3',
          '#F44336',
          '#9E9E9E',
        ],
      },
    ],
  };

  // Message type distribution
  const messageTypeDistribution = {
    labels: ['Email', 'SMS', 'Both'],
    datasets: [
      {
        data: [
          filteredCampaigns.filter(c => c.messageType === 'email').length,
          filteredCampaigns.filter(c => c.messageType === 'sms').length,
          filteredCampaigns.filter(c => c.messageType === 'both').length,
        ],
        backgroundColor: ['#2196F3', '#4CAF50', '#FF9800'],
      },
    ],
  };

  // Top performing campaigns
  const topCampaigns = filteredCampaigns
    .sort((a, b) => (b.stats?.deliveryRate || 0) - (a.stats?.deliveryRate || 0))
    .slice(0, 5);

  // Recent activity
  const recentActivity = filteredCampaigns
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (dashboardLoading || campaignsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Campaign Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into your campaign performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="1d">Last 24 hours</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Campaign Type</InputLabel>
            <Select
              value={campaignType}
              label="Campaign Type"
              onChange={(e) => setCampaignType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            size="small"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Campaigns
                  </Typography>
                  <Typography variant="h4">
                    {totalCampaigns}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Campaign />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Messages Sent
                  </Typography>
                  <Typography variant="h4">
                    {totalSent.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Email />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Delivered
                  </Typography>
                  <Typography variant="h4">
                    {totalDelivered.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Delivery Rate
                  </Typography>
                  <Typography variant="h4">
                    {avgDeliveryRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<BarChart />} label="Performance" />
          <Tab icon={<PieChart />} label="Distribution" />
          <Tab icon={<Timeline />} label="Trends" />
          <Tab icon={<Analytics />} label="Insights" />
        </Tabs>
      </Box>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardHeader title="Campaign Performance Over Time" />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Line
                    data={performanceOverTime}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
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
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Top Performing Campaigns" />
              <CardContent>
                <List>
                  {topCampaigns.map((campaign, index) => (
                    <React.Fragment key={campaign._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={campaign.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {campaign.stats?.totalSent || 0} sent
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip
                                  label={`${(campaign.stats?.deliveryRate || 0).toFixed(1)}%`}
                                  size="small"
                                  color="success"
                                />
                                <Chip
                                  label={campaign.messageType}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topCampaigns.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Distribution Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Campaign Status Distribution" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={statusDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Message Type Distribution" />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Pie
                    data={messageTypeDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Trends Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader title="Delivery Trends" />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Bar
                    data={{
                      labels: ['Email', 'SMS', 'Both'],
                      datasets: [
                        {
                          label: 'Sent',
                          data: [
                            filteredCampaigns.filter(c => c.messageType === 'email').reduce((sum, c) => sum + (c.stats?.totalSent || 0), 0),
                            filteredCampaigns.filter(c => c.messageType === 'sms').reduce((sum, c) => sum + (c.stats?.totalSent || 0), 0),
                            filteredCampaigns.filter(c => c.messageType === 'both').reduce((sum, c) => sum + (c.stats?.totalSent || 0), 0),
                          ],
                          backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        },
                        {
                          label: 'Delivered',
                          data: [
                            filteredCampaigns.filter(c => c.messageType === 'email').reduce((sum, c) => sum + (c.stats?.totalDelivered || 0), 0),
                            filteredCampaigns.filter(c => c.messageType === 'sms').reduce((sum, c) => sum + (c.stats?.totalDelivered || 0), 0),
                            filteredCampaigns.filter(c => c.messageType === 'both').reduce((sum, c) => sum + (c.stats?.totalDelivered || 0), 0),
                          ],
                          backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
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
          </Grid>
        </Grid>
      </TabPanel>

      {/* Insights Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardHeader title="Recent Campaign Activity" />
              <CardContent>
                <List>
                  {recentActivity.map((campaign, index) => (
                    <React.Fragment key={campaign._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: campaign.messageType === 'email' ? '#2196F3' : 
                                    campaign.messageType === 'sms' ? '#4CAF50' : '#FF9800'
                          }}>
                            {campaign.messageType === 'email' ? <Email /> : 
                             campaign.messageType === 'sms' ? <Sms /> : <Campaign />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={campaign.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {format(new Date(campaign.createdAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip
                                  label={campaign.status}
                                  size="small"
                                  color={
                                    campaign.status === 'completed' ? 'success' :
                                    campaign.status === 'sending' ? 'warning' :
                                    campaign.status === 'failed' ? 'error' : 'default'
                                  }
                                />
                                <Typography variant="caption" sx={{ ml: 1 }}>
                                  {campaign.stats?.totalSent || 0} sent • {campaign.audienceSize} recipients
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardHeader title="Performance Insights" />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Email campaigns</strong> show 15% higher delivery rates than SMS campaigns.
                    </Typography>
                  </Alert>
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>Peak performance</strong> occurs on Tuesday and Thursday mornings.
                    </Typography>
                  </Alert>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Campaign length</strong> of 2-3 sentences performs best for engagement.
                    </Typography>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CampaignAnalytics;
