import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Fab,
  Stack,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  Autocomplete,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  MoreVert,
  Edit,
  Delete,
  Email,
  Sms,
  GetApp,
  Visibility,
  Group,
  TrendingUp,
  ShoppingCart,
  People,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { customersAPI, Customer } from '../utils/api';

interface CustomerFilters {
  segment: string;
  status: string;
  search: string;
  minSpending: string;
  maxSpending: string;
  minOrders: string;
  maxOrders: string;
  joinedAfter: string;
  joinedBefore: string;
  lastOrderAfter: string;
  lastOrderBefore: string;
  tags: string[];
}

const Customers: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<CustomerFilters>({
    segment: '',
    status: '',
    search: '',
    minSpending: '',
    maxSpending: '',
    minOrders: '',
    maxOrders: '',
    joinedAfter: '',
    joinedBefore: '',
    lastOrderAfter: '',
    lastOrderBefore: '',
    tags: [],
  });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [moreFiltersDialogOpen, setMoreFiltersDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [sendSmsDialogOpen, setSendSmsDialogOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    segment: '',
    status: '',
  });
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
  });
  const [smsData, setSmsData] = useState({
    message: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    segment: 'regular',
    status: 'active',
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customersResponse, isLoading, error } = useQuery({
    queryKey: ['customers', page, rowsPerPage, filters],
    queryFn: () => customersAPI.getCustomers({
      page: page + 1,
      limit: rowsPerPage,
      search: filters.search,
      segment: filters.segment,
      status: filters.status,
      minSpending: filters.minSpending,
      maxSpending: filters.maxSpending,
      minOrders: filters.minOrders,
      maxOrders: filters.maxOrders,
      joinedAfter: filters.joinedAfter,
      joinedBefore: filters.joinedBefore,
      lastOrderAfter: filters.lastOrderAfter,
      lastOrderBefore: filters.lastOrderBefore,
      tags: filters.tags.join(','),
    }),
  });

  const customers = customersResponse?.data?.data || [];
  const totalCustomers = customersResponse?.data?.pagination?.total || 0;

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersAPI.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to delete customer',
        severity: 'error',
      });
    },
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (customerData: any) => customersAPI.createCustomer(customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setAddCustomerDialogOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        segment: 'regular',
        status: 'active',
      });
      setSnackbar({
        open: true,
        message: 'Customer created successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to create customer',
        severity: 'error',
      });
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customersAPI.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditCustomerDialogOpen(false);
      setSelectedCustomer(null);
      setSnackbar({
        open: true,
        message: 'Customer updated successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to update customer',
        severity: 'error',
      });
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((customer: Customer) => customer._id));
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedCustomer here as it's needed for dialogs
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer._id);
    }
  };

  const handleAddCustomer = () => {
    setAddCustomerDialogOpen(true);
  };

  const handleCreateCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      createMutation.mutate(newCustomer);
    }
  };

  const handleNewCustomerChange = (field: string, value: string) => {
    setNewCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleMoreFiltersOpen = () => {
    setMoreFiltersDialogOpen(true);
  };

  const handleClearAllFilters = () => {
    setFilters({
      segment: '',
      status: '',
      search: '',
      minSpending: '',
      maxSpending: '',
      minOrders: '',
      maxOrders: '',
      joinedAfter: '',
      joinedBefore: '',
      lastOrderAfter: '',
      lastOrderBefore: '',
      tags: [],
    });
    setPage(0);
  };

  const handleTagsChange = (newTags: string[]) => {
    setFilters(prev => ({ ...prev, tags: newTags }));
    setPage(0);
  };

  const handleViewDetails = () => {
    if (selectedCustomer) {
      setViewDetailsDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditCustomerData({
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone || '',
        segment: selectedCustomer.segment,
        status: selectedCustomer.status,
      });
      setEditCustomerDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleSendEmail = () => {
    setEmailData({
      subject: '',
      message: '',
    });
    setSendEmailDialogOpen(true);
    handleMenuClose();
  };

  const handleSendSms = () => {
    setSmsData({
      message: '',
    });
    setSendSmsDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateCustomer = () => {
    if (selectedCustomer) {
      updateMutation.mutate({
        id: selectedCustomer._id,
        data: editCustomerData,
      });
    }
  };

  const handleSendEmailSubmit = async () => {
    if (!selectedCustomer || !emailData.subject || !emailData.message) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/communication/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          subject: emailData.subject,
          message: emailData.message
        })
      });

      const result = await response.json();

      if (result.success) {
        setSendEmailDialogOpen(false);
        setEmailData({ subject: '', message: '' });
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success',
        });

        // Show preview URL if available (for development)
        if (result.previewUrl) {
          console.log('Email preview URL:', result.previewUrl);
        }
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to send email',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send email. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleSendSmsSubmit = async () => {
    if (!selectedCustomer || !smsData.message) {
      setSnackbar({
        open: true,
        message: 'Please enter a message',
        severity: 'error',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/communication/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomer._id,
          message: smsData.message
        })
      });

      const result = await response.json();

      if (result.success) {
        setSendSmsDialogOpen(false);
        setSmsData({ message: '' });
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to send SMS',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send SMS. Please try again.',
        severity: 'error',
      });
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'premium': return 'primary';
      case 'standard': return 'default';
      case 'basic': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Quick stats
  const activeCustomers = customers.filter((customer: Customer) => customer.status === 'active').length;
  const premiumCustomers = customers.filter((customer: Customer) => customer.segment === 'premium').length;
  const totalRevenue = customers.reduce((sum: number, customer: Customer) => sum + (customer.totalSpent || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Customers
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Customer management interface with filtering, segmentation, and bulk operations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ height: 'fit-content' }}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <People />
            </Avatar>
            <Box>
              <Typography variant="h6">{totalCustomers}</Typography>
              <Typography variant="body2" color="textSecondary">Total Customers</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <TrendingUp />
            </Avatar>
            <Box>
              <Typography variant="h6">{activeCustomers}</Typography>
              <Typography variant="body2" color="textSecondary">Active Customers</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h6">{premiumCustomers}</Typography>
              <Typography variant="body2" color="textSecondary">Premium Customers</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <ShoppingCart />
            </Avatar>
            <Box>
              <Typography variant="h6">${totalRevenue.toLocaleString()}</Typography>
              <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search customers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Segment</InputLabel>
              <Select
                value={filters.segment}
                label="Segment"
                onChange={(e) => handleFilterChange('segment', e.target.value)}
              >
                <MenuItem value="">All Segments</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<FilterList />}
              variant="outlined"
              onClick={handleMoreFiltersOpen}
            >
              More Filters
            </Button>
            {selectedCustomers.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button startIcon={<Email />} variant="outlined" size="small">
                  Email ({selectedCustomers.length})
                </Button>
                <Button startIcon={<Sms />} variant="outlined" size="small">
                  SMS ({selectedCustomers.length})
                </Button>
                <Button startIcon={<GetApp />} variant="outlined" size="small">
                  Export ({selectedCustomers.length})
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {(filters.search || filters.segment || filters.status || filters.minSpending || filters.maxSpending || 
        filters.minOrders || filters.maxOrders || filters.joinedAfter || filters.joinedBefore || 
        filters.lastOrderAfter || filters.lastOrderBefore || filters.tags.length > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Active Filters:
              </Typography>
              {filters.search && (
                <Chip 
                  label={`Search: "${filters.search}"`} 
                  onDelete={() => handleFilterChange('search', '')} 
                  size="small" 
                />
              )}
              {filters.segment && (
                <Chip 
                  label={`Segment: ${filters.segment}`} 
                  onDelete={() => handleFilterChange('segment', '')} 
                  size="small" 
                />
              )}
              {filters.status && (
                <Chip 
                  label={`Status: ${filters.status}`} 
                  onDelete={() => handleFilterChange('status', '')} 
                  size="small" 
                />
              )}
              {filters.minSpending && (
                <Chip 
                  label={`Min Spending: $${filters.minSpending}`} 
                  onDelete={() => handleFilterChange('minSpending', '')} 
                  size="small" 
                />
              )}
              {filters.maxSpending && (
                <Chip 
                  label={`Max Spending: $${filters.maxSpending}`} 
                  onDelete={() => handleFilterChange('maxSpending', '')} 
                  size="small" 
                />
              )}
              {filters.minOrders && (
                <Chip 
                  label={`Min Orders: ${filters.minOrders}`} 
                  onDelete={() => handleFilterChange('minOrders', '')} 
                  size="small" 
                />
              )}
              {filters.maxOrders && (
                <Chip 
                  label={`Max Orders: ${filters.maxOrders}`} 
                  onDelete={() => handleFilterChange('maxOrders', '')} 
                  size="small" 
                />
              )}
              {filters.tags.map(tag => (
                <Chip 
                  key={tag}
                  label={`Tag: ${tag}`} 
                  onDelete={() => handleTagsChange(filters.tags.filter(t => t !== tag))} 
                  size="small" 
                />
              ))}
              <Button onClick={handleClearAllFilters} size="small" variant="text">
                Clear All
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={customers.length > 0 && selectedCustomers.length === customers.length}
                      indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < customers.length}
                      onChange={handleSelectAllCustomers}
                    />
                  </TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Segment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Last Order</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Error loading customers
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: Customer) => (
                    <TableRow key={customer._id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleSelectCustomer(customer._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {customer.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {customer.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={customer.segment}
                          color={getSegmentColor(customer.segment) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={customer.status}
                          color={getStatusColor(customer.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          ${(customer.totalSpent || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {customer.orderCount || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {customer.lastOrderDate 
                            ? format(new Date(customer.lastOrderDate), 'MMM dd, yyyy')
                            : 'Never'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, customer)}
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCustomers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Customer Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditCustomer}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Customer
        </MenuItem>
        <MenuItem onClick={handleSendEmail}>
          <Email sx={{ mr: 1 }} fontSize="small" />
          Send Email
        </MenuItem>
        <MenuItem onClick={handleSendSms}>
          <Sms sx={{ mr: 1 }} fontSize="small" />
          Send SMS
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Customer
        </MenuItem>
      </Menu>

      {/* More Filters Dialog */}
      <Dialog open={moreFiltersDialogOpen} onClose={() => setMoreFiltersDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Advanced Filters
            <Button onClick={handleClearAllFilters} size="small" color="secondary">
              Clear All
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Spending Range */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Spending Range
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Min Spending"
                    type="number"
                    value={filters.minSpending}
                    onChange={(e) => handleFilterChange('minSpending', e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Max Spending"
                    type="number"
                    value={filters.maxSpending}
                    onChange={(e) => handleFilterChange('maxSpending', e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Order Count Range */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Order Count Range
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Min Orders"
                    type="number"
                    value={filters.minOrders}
                    onChange={(e) => handleFilterChange('minOrders', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Max Orders"
                    type="number"
                    value={filters.maxOrders}
                    onChange={(e) => handleFilterChange('maxOrders', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Registration Date Range */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Registration Date Range
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Joined After"
                    type="date"
                    value={filters.joinedAfter}
                    onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Joined Before"
                    type="date"
                    value={filters.joinedBefore}
                    onChange={(e) => handleFilterChange('joinedBefore', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Last Order Date Range */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Last Order Date Range
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Last Order After"
                    type="date"
                    value={filters.lastOrderAfter}
                    onChange={(e) => handleFilterChange('lastOrderAfter', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Last Order Before"
                    type="date"
                    value={filters.lastOrderBefore}
                    onChange={(e) => handleFilterChange('lastOrderBefore', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Customer Tags */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Customer Tags
              </Typography>
              <Autocomplete
                multiple
                options={['vip', 'frequent-buyer', 'tech-enthusiast', 'fashion-lover', 'loyal-customer', 'potential', 'premium-member']}
                value={filters.tags}
                onChange={(event, newValue) => handleTagsChange(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Tags"
                    placeholder="Choose customer tags..."
                  />
                )}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoreFiltersDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setMoreFiltersDialogOpen(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addCustomerDialogOpen} onClose={() => setAddCustomerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Customer Name"
              value={newCustomer.name}
              onChange={(e) => handleNewCustomerChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email Address"
              type="email"
              value={newCustomer.email}
              onChange={(e) => handleNewCustomerChange('email', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Segment</InputLabel>
              <Select
                value={newCustomer.segment}
                label="Segment"
                onChange={(e) => handleNewCustomerChange('segment', e.target.value)}
              >
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newCustomer.status}
                label="Status"
                onChange={(e) => handleNewCustomerChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCustomerDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCustomer} 
            variant="contained"
            disabled={!newCustomer.name || !newCustomer.email || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onClose={() => {
        setViewDetailsDialogOpen(false);
        setSelectedCustomer(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Personal Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Name
                          </Typography>
                          <Typography variant="body1">
                            {selectedCustomer.name}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedCustomer.email}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {selectedCustomer.phone || 'Not provided'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Customer Status
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Segment
                          </Typography>
                          <Box>
                            <Chip 
                              label={selectedCustomer.segment} 
                              color={getSegmentColor(selectedCustomer.segment) as any}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Status
                          </Typography>
                          <Box>
                            <Chip 
                              label={selectedCustomer.status} 
                              color={getStatusColor(selectedCustomer.status) as any}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Member Since
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(selectedCustomer.createdAt), 'MMMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Purchase History
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 4 }}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              ${(selectedCustomer.totalSpent || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Total Spent
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              {selectedCustomer.orderCount || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Total Orders
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                              {selectedCustomer.lastOrderDate 
                                ? format(new Date(selectedCustomer.lastOrderDate), 'MMM dd, yyyy')
                                : 'Never'
                              }
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Last Order
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Customer Tags
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedCustomer.tags.map((tag, index) => (
                            <Chip key={index} label={tag} variant="outlined" size="small" />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDetailsDialogOpen(false);
            setSelectedCustomer(null);
          }}>Close</Button>
          <Button onClick={handleEditCustomer} variant="contained" startIcon={<Edit />}>
            Edit Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerDialogOpen} onClose={() => setEditCustomerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Customer Name"
              value={editCustomerData.name}
              onChange={(e) => setEditCustomerData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email Address"
              type="email"
              value={editCustomerData.email}
              onChange={(e) => setEditCustomerData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              value={editCustomerData.phone}
              onChange={(e) => setEditCustomerData(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Segment</InputLabel>
              <Select
                value={editCustomerData.segment}
                label="Segment"
                onChange={(e) => setEditCustomerData(prev => ({ ...prev, segment: e.target.value }))}
              >
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editCustomerData.status}
                label="Status"
                onChange={(e) => setEditCustomerData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCustomerDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateCustomer} 
            variant="contained"
            disabled={!editCustomerData.name || !editCustomerData.email || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialogOpen} onClose={() => setSendEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Email to {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="To"
              value={selectedCustomer?.email || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Message"
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              multiline
              rows={6}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendEmailDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendEmailSubmit} 
            variant="contained"
            disabled={!emailData.subject || !emailData.message}
            startIcon={<Email />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send SMS Dialog */}
      <Dialog open={sendSmsDialogOpen} onClose={() => setSendSmsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send SMS to {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="To"
              value={selectedCustomer?.phone || 'No phone number'}
              disabled
              fullWidth
            />
            <TextField
              label="Message"
              value={smsData.message}
              onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              required
              helperText={`${smsData.message.length}/160 characters`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendSmsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendSmsSubmit} 
            variant="contained"
            disabled={!smsData.message || !selectedCustomer?.phone}
            startIcon={<Sms />}
          >
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;
