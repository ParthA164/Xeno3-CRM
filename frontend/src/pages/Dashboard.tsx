import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  ShoppingCart,
  Campaign,
  Email,
  Sms,
  MoreVert,
  Add,
  Analytics,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

import { customersAPI, ordersAPI, campaignsAPI, dashboardAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

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

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {isPositive ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: 20 }} />
              )}
              <Typography
                variant="body2"
                sx={{ color: isPositive ? 'success.main' : 'error.main' }}
              >
                {isPositive ? '+' : ''}{change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                from last month
              </Typography>
            </Box>
          </Box>
          <Avatar
            sx={{
              backgroundColor: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardResponse, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  const dashboardStats = dashboardResponse?.data?.data;

  // Chart data based on real backend data
  const salesData = {
    labels: dashboardStats?.monthlyRevenue?.map((item: any) => item.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardStats?.monthlyRevenue?.map((item: any) => item.revenue) || [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  // Campaign performance by status - matching the actual campaigns in the system
  const campaignPerformanceData = {
    labels: dashboardStats?.campaignPerformance?.map((item: any) => item.status) || [],
    datasets: [
      {
        data: dashboardStats?.campaignPerformance?.map((item: any) => item.count) || [],
        backgroundColor: dashboardStats?.campaignPerformance?.map((item: any) => {
          switch (item.status) {
            case 'draft': return '#36A2EB'; // blue
            case 'completed': return '#4CAF50'; // green
            case 'scheduled': return '#FF9800'; // orange
            case 'sending': return '#FF6384'; // pink
            case 'paused': return '#FFC107'; // amber
            case 'failed': return '#F44336'; // red
            case 'sent': return '#9C27B0'; // purple
            default: return '#9E9E9E'; // grey for unknown status
          }
        }) || [],
        borderWidth: 2,
      },
    ],
  };

  // Customer segments from real data
  const customerSegmentData = {
    labels: dashboardStats?.customerSegments?.map((item: any) => item.segment) || ['VIP', 'Regular', 'New', 'Inactive'],
    datasets: [
      {
        label: 'Customers',
        data: dashboardStats?.customerSegments?.map((item: any) => item.count) || [120, 450, 200, 80],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      },
    ],
  };

  // Order status distribution
  const orderStatusData = {
    labels: dashboardStats?.orderStatuses?.map((item: any) => item.status) || ['Pending', 'Confirmed', 'Shipped', 'Delivered'],
    datasets: [
      {
        label: 'Orders',
        data: dashboardStats?.orderStatuses?.map((item: any) => item.count) || [25, 45, 30, 100],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(76, 175, 80, 0.8)',
        ],
      },
    ],
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: dashboardStats?.totalCustomers || 0,
      change: dashboardStats?.customerGrowth || 0,
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: 'Total Orders',
      value: dashboardStats?.totalOrders || 0,
      change: dashboardStats?.orderGrowth || 0,
      icon: <ShoppingCart />,
      color: '#388e3c',
    },
    {
      title: 'Active Campaigns',
      value: dashboardStats?.totalCampaigns || 0,
      change: dashboardStats?.campaignGrowth || 0,
      icon: <Campaign />,
      color: '#f57c00',
    },
    {
      title: 'Monthly Revenue',
      value: `$${(dashboardStats?.totalRevenue || 0).toLocaleString()}`,
      change: dashboardStats?.revenueGrowth || 0,
      icon: <Analytics />,
      color: '#7b1fa2',
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography color="error">Error loading dashboard data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your CRM today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {statCards.map((stat: any, index: number) => (
          <Box key={index} sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <StatCard {...stat} />
          </Box>
        ))}
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Revenue Chart */}
        <Box sx={{ flex: '2 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Revenue Trend</Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line
                  data={salesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Campaign Performance */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campaign Status
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={campaignPerformanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Second Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Customer Segments */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Segments
              </Typography>
              <Box sx={{ height: 250 }}>
                <Bar
                  data={customerSegmentData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
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
        </Box>

        {/* Order Status Distribution */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <Bar
                  data={orderStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
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
        </Box>
      </Box>

      {/* Third Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Recent Campaigns */}
        <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent Campaigns</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => window.location.href = '/campaigns/new'}>
                  New Campaign
                </Button>
              </Box>
              <List>
                {dashboardStats?.recentCampaigns?.slice(0, 3).map((campaign: any, index: number) => (
                  <React.Fragment key={campaign._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: campaign.messageType === 'email' ? '#1976d2' : '#388e3c' }}>
                          {campaign.messageType === 'email' ? <Email /> : <Sms />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={campaign.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {campaign.audienceSize || 0} recipients • {new Date(campaign.createdAt).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={campaign.status}
                                size="small"
                                color={
                                  campaign.status === 'completed' ? 'success' :
                                  campaign.status === 'sending' ? 'warning' :
                                  campaign.status === 'scheduled' ? 'info' :
                                  campaign.status === 'draft' ? 'default' :
                                  campaign.status === 'failed' ? 'error' :
                                  campaign.status === 'paused' ? 'secondary' :
                                  campaign.status === 'sent' ? 'primary' :
                                  'default'
                                }
                              />
                              {campaign.status === 'sending' && campaign.audienceSize > 0 && (
                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(campaign.stats?.totalSent || 0) / (campaign.audienceSize || 1) * 100}
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < 2 && <Divider component="li" />}
                  </React.Fragment>
                ))}
                {(!dashboardStats?.recentCampaigns || dashboardStats.recentCampaigns.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="No campaigns yet"
                      secondary="Create your first campaign to get started"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Orders */}
        <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <List>
                {dashboardStats?.recentOrders?.slice(0, 5).map((order: any, index: number) => (
                  <React.Fragment key={order._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: 'primary.main' }}>
                          <ShoppingCart />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`Order #${order.orderNumber}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {order.customerId?.name || 'Unknown Customer'} • ${order.amount}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={order.status}
                                size="small"
                                color={
                                  order.status === 'delivered' ? 'success' :
                                  order.status === 'shipped' ? 'info' :
                                  order.status === 'confirmed' ? 'primary' :
                                  order.status === 'pending' ? 'warning' : 'default'
                                }
                              />
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < 4 && <Divider component="li" />}
                  </React.Fragment>
                ))}
                {(!dashboardStats?.recentOrders || dashboardStats.recentOrders.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="No orders yet"
                      secondary="Orders will appear here once customers start placing them"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Quick Actions & Recent Activity */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Quick Actions */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />} 
                  fullWidth
                  onClick={() => window.location.href = '/campaigns/new'}
                >
                  Create Campaign
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<People />} 
                  fullWidth
                  onClick={() => window.location.href = '/customers'}
                >
                  Manage Customers
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<ShoppingCart />} 
                  fullWidth
                  onClick={() => window.location.href = '/orders'}
                >
                  View Orders
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Analytics />} 
                  fullWidth
                  onClick={() => window.location.href = '/campaigns'}
                >
                  Campaign Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Customers */}
        <Box sx={{ flex: '2 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Customers
              </Typography>
              <List>
                {dashboardStats?.recentCustomers?.map((customer: any, index: number) => (
                  <React.Fragment key={customer._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>
                          {customer.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={customer.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {customer.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Spending: ${(customer.totalSpending || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </Typography>
                        <Chip
                          label={customer.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    </ListItem>
                    {index < (dashboardStats?.recentCustomers?.length || 0) - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
