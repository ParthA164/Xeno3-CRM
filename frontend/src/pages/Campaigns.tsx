import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Analytics,
  Email,
  Sms,
  ContentCopy,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { campaignsAPI, Campaign } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface CampaignFilters {
  status: string;
  messageType: string;
  search: string;
}

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<CampaignFilters>({
    status: '',
    messageType: '',
    search: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    messageType: 'email',
    message: '',
    audienceRules: [{ field: 'isActive', operator: '==', value: true }],
    naturalLanguageQuery: '',
    audienceSize: 0
  });

  // Effects
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    } else {
      console.log('User authenticated, current user:', user);
    }
  }, [isAuthenticated, navigate, user]);

  // Fetch campaigns
  const { data: campaignsData, isLoading, error } = useQuery({
    queryKey: ['campaigns', page, rowsPerPage, filters],
    queryFn: async () => {
      console.log('Fetching campaigns with params:', {
        page: page + 1,
        limit: rowsPerPage,
        status: filters.status || undefined,
        messageType: filters.messageType || undefined,
        search: filters.search || undefined,
      });
      
      try {
        const token = localStorage.getItem('token');
        console.log('Auth token available:', !!token);
        
        const response = await campaignsAPI.getCampaigns({
          page: page + 1,
          limit: rowsPerPage,
          status: filters.status || undefined,
          messageType: filters.messageType || undefined,
          search: filters.search || undefined,
        });
        
        console.log('Campaigns API response:', response);
        
        if (!response.data?.data || response.data.data.length === 0) {
          console.log('No campaigns found in response.');
        }
        
        return response;
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        throw err;
      }
    },
    staleTime: 0, // Disable caching to ensure fresh data
    retry: 2,     // Retry failed requests
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.sendCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      handleMenuClose();
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      handleMenuClose();
    },
  });

  const createMutation = useMutation({
    mutationFn: (campaignData: any) => campaignsAPI.createCampaign(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        messageType: 'email',
        message: '',
        audienceRules: [{ field: 'isActive', operator: '==', value: true }],
        naturalLanguageQuery: '',
        audienceSize: 0
      });
    },
  });

  // Event handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof CampaignFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, campaign: Campaign) => {
    setAnchorEl(event.currentTarget);
    setSelectedCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCampaign(null);
  };

  const handleEdit = () => {
    if (selectedCampaign) {
      navigate(`/campaigns/${selectedCampaign._id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSend = () => {
    if (selectedCampaign) {
      sendMutation.mutate(selectedCampaign._id);
    }
  };

  const handlePause = () => {
    if (selectedCampaign) {
      pauseMutation.mutate(selectedCampaign._id);
    }
  };

  const handleAnalytics = () => {
    if (selectedCampaign) {
      navigate(`/campaigns/${selectedCampaign._id}?tab=analytics`);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'sending':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'failed':
        return 'error';
      case 'paused':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (messageType: string) => {
    return messageType === 'email' ? <Email /> : messageType === 'sms' ? <Sms /> : <Email />;
  };

  const canSend = (campaign: Campaign) => {
    return ['draft', 'paused', 'scheduled'].includes(campaign.status);
  };

  const canPause = (campaign: Campaign) => {
    return campaign.status === 'sending';
  };

  const campaigns: Campaign[] = campaignsData?.data?.data || [];
  const totalCampaigns = campaignsData?.data?.pagination?.total || 0;

  // Debug logging
  console.log('Campaigns data:', campaignsData);
  console.log('Processed campaigns:', campaigns);
  console.log('Total campaigns:', totalCampaigns);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('Auth token:', localStorage.getItem('token'));
  console.log('User:', localStorage.getItem('user'));

  if (error) {
    console.error('Campaign fetch error:', error);
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/campaigns/new')}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading campaigns. Please try again or check your connection.
        </Alert>
      )}

      {/* No Campaigns Alert */}
      {!isLoading && !error && (!campaigns || campaigns.length === 0) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No campaigns found. Create your first campaign to get started.
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Campaigns
            </Typography>
            <Typography variant="h4">
              {totalCampaigns}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Campaigns
            </Typography>
            <Typography variant="h4">
              {campaigns.filter(c => ['sending', 'scheduled'].includes(c.status)).length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Sent
            </Typography>
            <Typography variant="h4">
              {campaigns.reduce((sum, c) => sum + c.stats.totalSent, 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg. Delivery Rate
            </Typography>
            <Typography variant="h4">
              {campaigns.length > 0 
                ? Math.round(campaigns.reduce((sum, c) => sum + c.stats.deliveryRate, 0) / campaigns.length)
                : 0}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search campaigns..."
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="sending">Sending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.messageType}
                label="Type"
                onChange={(e) => handleFilterChange('messageType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilters({ status: '', messageType: '', search: '' })}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Sent / Delivered</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No campaigns found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getStatusIcon(campaign.messageType)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {campaign.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {campaign.description || 'No description'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={campaign.messageType.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={campaign.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(campaign.status) as any}
                      />
                      {campaign.status === 'sending' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(campaign.stats.totalSent / campaign.audienceSize) * 100}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((campaign.stats.totalSent / campaign.audienceSize) * 100)}% sent
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {campaign.audienceSize.toLocaleString()} recipients
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {campaign.stats.totalSent.toLocaleString()} / {campaign.stats.totalDelivered.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {campaign.stats.deliveryRate.toFixed(1)}% delivery rate
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(campaign.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(campaign.createdAt), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, campaign)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCampaigns}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleAnalytics}>
          <Analytics sx={{ mr: 1 }} /> Analytics
        </MenuItem>
        {selectedCampaign && canSend(selectedCampaign) && (
          <MenuItem onClick={handleSend}>
            <PlayArrow sx={{ mr: 1 }} /> Send
          </MenuItem>
        )}
        {selectedCampaign && canPause(selectedCampaign) && (
          <MenuItem onClick={handlePause}>
            <Pause sx={{ mr: 1 }} /> Pause
          </MenuItem>
        )}
        <MenuItem onClick={() => {}}>
          <ContentCopy sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedCampaign && deleteMutation.mutate(selectedCampaign._id)}
            color="error"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Campaigns;
