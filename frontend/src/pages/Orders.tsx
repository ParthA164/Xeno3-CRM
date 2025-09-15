import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Pagination,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider
} from '@mui/material';
import {
  Visibility,
  Edit,
  LocalShipping,
  CheckCircle,
  Cancel,
  AccessTime,
  ShoppingCart,
  TrendingUp,
  AttachMoney,
  Save,
  Close,
  Add
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Order {
  _id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error'
};

const statusIcons: Record<string, React.ReactElement> = {
  pending: <AccessTime />,
  processing: <ShoppingCart />,
  shipped: <LocalShipping />,
  delivered: <CheckCircle />,
  cancelled: <Cancel />
};

const Orders: React.FC = () => {
  const [page, setPage] = useState(1);
  
  // Form states (what user is typing/selecting)
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  
  // Applied filter states (what's actually used in API calls)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    items: [{ productName: '', quantity: 1, price: 0 }],
    paymentMethod: 'credit_card',
    shippingAddress: ''
  });
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Apply filters function
  const handleApplyFilters = () => {
    setAppliedSearchTerm(searchInput);
    setAppliedStatusFilter(statusInput);
    setPage(1); // Reset to first page when applying new filters
  };

  // Clear filters function
  const handleClearFilters = () => {
    setSearchInput('');
    setStatusInput('');
    setAppliedSearchTerm('');
    setAppliedStatusFilter('');
    setPage(1);
  };

  // Fetch orders
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['orders', page, appliedStatusFilter, appliedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(appliedStatusFilter && { status: appliedStatusFilter }),
        ...(appliedSearchTerm && { search: appliedSearchTerm })
      });
      
      const response = await fetch(`http://localhost:5000/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return response.json();
    }
  });

  // Fetch order statistics
  const { data: stats } = useQuery<OrderStats>({
    queryKey: ['orders-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/orders/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order stats');
      }
      
      return response.json();
    }
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      setCreateOrderOpen(false);
      // Reset form
      setNewOrder({
        customerId: '',
        customerName: '',
        customerEmail: '',
        items: [{ productName: '', quantity: 1, price: 0 }],
        paymentMethod: 'credit_card',
        shippingAddress: ''
      });
    }
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
    // Cancel editing mode
    setEditingOrderId(null);
    setEditingStatus('');
  };

  const handleEditStatus = (orderId: string, currentStatus: string) => {
    setEditingOrderId(orderId);
    setEditingStatus(currentStatus);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditingStatus('');
  };

  const handleCreateOrder = () => {
    console.log('Creating order with data:', newOrder);
    
    // Calculate total amount
    const totalAmount = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Create customer and order data
    const customerData = {
      name: newOrder.customerName,
      email: newOrder.customerEmail,
      address: newOrder.shippingAddress
    };
    
    const orderData = {
      customerData: customerData, // We'll modify backend to handle this
      items: newOrder.items.map(item => ({
        productId: item.productName, // Using productName as productId for simplicity
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      amount: totalAmount,
      paymentMethod: newOrder.paymentMethod,
      shippingAddress: {
        street: newOrder.shippingAddress,
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      status: 'pending'
    };
    
    console.log('Submitting order data:', orderData);
    createOrderMutation.mutate(orderData);
  };

  const handleAddItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = appliedSearchTerm === '' || 
      order.orderId.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(appliedSearchTerm.toLowerCase());
    
    const matchesStatus = appliedStatusFilter === '' || order.status === appliedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load orders. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Order Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOrderOpen(true)}
          sx={{ bgcolor: '#1976d2' }}
        >
          Create New Order
        </Button>
      </Box>

      {/* Order Statistics */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalOrders}
                    </Typography>
                  </Box>
                  <ShoppingCart color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4">
                      ${stats.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <AttachMoney color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Orders
                    </Typography>
                    <Typography variant="h4">
                      {stats.pendingOrders}
                    </Typography>
                  </Box>
                  <AccessTime color="warning" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Avg. Order Value
                    </Typography>
                    <Typography variant="h4">
                      ${stats.averageOrderValue.toFixed(2)}
                    </Typography>
                  </Box>
                  <TrendingUp color="info" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search orders..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
              placeholder="Order ID, customer name, or email"
              helperText={
                appliedSearchTerm 
                  ? `Showing results for "${appliedSearchTerm}"` 
                  : "Enter search terms and click Apply to filter"
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusInput}
                label="Status"
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                size="small"
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
              >
                Clear
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {order.orderId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {order.customerName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.customerEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(order.orderDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ${order.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[order.status]}
                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    color={statusColors[order.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} alignItems="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    {editingOrderId === order._id ? (
                      // Status editing mode
                      <>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            size="small"
                            variant="outlined"
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="processing">Processing</MenuItem>
                            <MenuItem value="shipped">Shipped</MenuItem>
                            <MenuItem value="delivered">Delivered</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                        <Tooltip title="Save">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusUpdate(order._id, editingStatus)}
                            disabled={!editingStatus || editingStatus === order.status}
                            color="primary"
                          >
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                          >
                            <Close />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      // Normal mode with edit button
                      <Tooltip title="Edit Status">
                        <IconButton
                          size="small"
                          onClick={() => handleEditStatus(order._id, order.status)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>

      {/* Create Order Dialog */}
      <Dialog
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Customer Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Customer Email"
                    type="email"
                    value={newOrder.customerEmail}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, customerEmail: e.target.value }))}
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Order Items */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Order Items
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddItem}
                  size="small"
                >
                  Add Item
                </Button>
              </Box>
              {newOrder.items.map((item, index) => (
                <Grid container spacing={2} key={index} alignItems="center" mb={1}>
                  <Grid size={{ xs: 5 }}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1 }}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    {newOrder.items.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                        size="small"
                      >
                        <Close />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}
            </Box>

            {/* Payment and Shipping */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={newOrder.paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setNewOrder(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cash_on_delivery">Cash on Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Shipping Address"
                  multiline
                  rows={2}
                  value={newOrder.shippingAddress}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, shippingAddress: e.target.value }))}
                  required
                />
              </Grid>
            </Grid>

            {/* Order Total */}
            <Box>
              <Typography variant="h6" align="right">
                Total: ${newOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOrderOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrder}
            variant="contained"
            disabled={
              !newOrder.customerName ||
              !newOrder.customerEmail ||
              !newOrder.shippingAddress ||
              newOrder.items.some(item => !item.productName || item.quantity < 1 || item.price < 0) ||
              createOrderMutation.isPending
            }
          >
            {createOrderMutation.isPending ? <CircularProgress size={20} /> : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.orderId}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Stack spacing={3}>
              {/* Order Info */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Order Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Order ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.orderId}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrder.orderDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      icon={statusIcons[selectedOrder.status]}
                      label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      color={statusColors[selectedOrder.status]}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Payment Method
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.paymentMethod}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Customer Info */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.customerName}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.customerEmail}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Shipping Address */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Shipping Address
                </Typography>
                <Typography variant="body1">
                  {selectedOrder.shippingAddress.street}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                  {selectedOrder.shippingAddress.country}
                </Typography>
              </Box>

              <Divider />

              {/* Order Items */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            ${(item.quantity * item.price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="h6">Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6">
                            ${selectedOrder.totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
