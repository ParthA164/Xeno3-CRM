import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error (401):', error.response?.data);
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      console.error('API error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DemoLoginResponse {
  success: boolean;
  data: User;
  token: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalCampaigns: number;
  customerGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
  campaignGrowth: number;
  recentOrders: Order[];
  recentCampaigns: Campaign[];
  recentCustomers: Customer[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  customerSegments: Array<{ segment: string; count: number }>;
  orderStatuses: Array<{ status: string; count: number }>;
  campaignPerformance: Array<{ status: string; count: number; totalSent: number; totalDelivered: number }>;
}

// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpending: number;
  totalSpent?: number; // alias for totalSpending for frontend compatibility
  visits: number;
  lastVisit: string;
  registrationDate: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'pending';
  segment: 'premium' | 'regular' | 'vip' | 'bronze' | 'silver' | 'gold';
  orderCount?: number;
  lastOrderDate?: string;
  tags: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  _id: string;
  customerId: string | Customer;
  orderNumber: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'cash_on_delivery';
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  category?: string;
}

// Campaign Types
export interface AudienceRule {
  field: 'totalSpending' | 'visits' | 'daysSinceLastVisit' | 'registrationDate' | 'segment' | 'isActive' | 'tags';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not_contains';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  createdBy: string | User;
  audienceRules: AudienceRule[];
  naturalLanguageQuery?: string;
  audienceSize: number;
  message: string;
  messageType: 'email' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  stats: {
    totalSent: number;
    totalFailed: number;
    totalDelivered: number;
    deliveryRate: number;
  };
  aiSuggestions?: {
    messageVariants: Array<{
      text: string;
      tone: string;
      score: number;
    }>;
    audienceInsights?: string;
    performancePrediction?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Communication Log Types
export interface CommunicationLog {
  _id: string;
  campaignId: string;
  customerId: string | Customer;
  messageId: string;
  messageType: 'email' | 'sms';
  recipient: {
    email?: string;
    phone?: string;
  };
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

// Authentication API
export const authAPI = {
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  getUserStats: () => api.get<ApiResponse<any>>('/auth/stats'),
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/auth/profile', data),
  logout: () => api.post<ApiResponse>('/auth/logout'),
  demoLogin: () => api.post<DemoLoginResponse>('/auth/demo-login'),
};

// Customers API
export const customersAPI = {
  getCustomers: (params?: any) => api.get<ApiResponse<Customer[]>>('/customers', { params }),
  getCustomer: (id: string) => api.get<ApiResponse<{ customer: Customer; orders: Order[]; stats: any }>>(`/customers/${id}`),
  createCustomer: (data: Partial<Customer>) => api.post<ApiResponse<Customer>>('/customers', data),
  updateCustomer: (id: string, data: Partial<Customer>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete<ApiResponse>(`/customers/${id}`),
  bulkCreateCustomers: (customers: Partial<Customer>[]) => api.post<ApiResponse<Customer[]>>('/customers/bulk', { customers }),
  getCustomerStats: () => api.get<ApiResponse<any>>('/customers/stats'),
};

// Orders API
export const ordersAPI = {
  getOrders: (params?: any) => api.get<ApiResponse<Order[]>>('/orders', { params }),
  getOrder: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),
  createOrder: (data: Partial<Order>) => api.post<ApiResponse<Order>>('/orders', data),
  updateOrder: (id: string, data: Partial<Order>) => api.put<ApiResponse<Order>>(`/orders/${id}`, data),
  deleteOrder: (id: string) => api.delete<ApiResponse>(`/orders/${id}`),
  bulkCreateOrders: (orders: Partial<Order>[]) => api.post<ApiResponse<Order[]>>('/orders/bulk', { orders }),
  getOrderStats: () => api.get<ApiResponse<any>>('/orders/stats'),
};

// Campaigns API
export const campaignsAPI = {
  getCampaigns: (params?: any) => api.get<ApiResponse<Campaign[]>>('/campaigns', { params }),
  getCampaign: (id: string) => api.get<ApiResponse<{ campaign: Campaign; logs: CommunicationLog[] }>>(`/campaigns/${id}`),
  createCampaign: (data: Partial<Campaign>) => api.post<ApiResponse<Campaign>>('/campaigns', data),
  updateCampaign: (id: string, data: Partial<Campaign>) => api.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete<ApiResponse>(`/campaigns/${id}`),
  previewAudience: (data: { audienceRules?: AudienceRule[]; naturalLanguageQuery?: string }) => 
    api.post<ApiResponse<{ audienceSize: number; sampleCustomers: Customer[]; estimatedCost: number; estimatedDeliveryTime: number; rules?: AudienceRule[] }>>('/campaigns/preview', data),
  suggestMessage: (data: { campaignType: string; audienceDescription: string }) =>
    api.post<ApiResponse<string>>('/ai/suggest-message', data),
  generateMessageVariants: (message: string, objective?: string) =>
    api.post<ApiResponse<{ messageVariants: Array<{ text: string; tone: string; score: number }>; originalMessage: string }>>('/ai/message-variants', { message, objective }),
  sendCampaign: (id: string) => api.post<ApiResponse<Campaign>>(`/campaigns/${id}/send`),
  pauseCampaign: (id: string) => api.post<ApiResponse<Campaign>>(`/campaigns/${id}/pause`),
  getCampaignAnalytics: (id: string) => api.get<ApiResponse<any>>(`/campaigns/${id}/analytics`),
};

// AI API
export const aiAPI = {
  parseNaturalLanguage: (query: string) => 
    api.post<ApiResponse<{ rules: AudienceRule[]; audienceSize: number; originalQuery: string }>>('/ai/parse-language', { query }),
  generateMessageVariants: (message: string, objective?: string) => 
    api.post<ApiResponse<{ messageVariants: Array<{ text: string; tone: string; score: number }>; originalMessage: string }>>('/ai/message-variants', { message, objective }),
  getAudienceInsights: (audienceRules: AudienceRule[], audienceSize: number) => 
    api.post<ApiResponse<{ description: string; characteristics: string[]; opportunities: string[]; recommendedMessage: string }>>('/ai/audience-insights', { audienceRules, audienceSize }),
  getOptimalSendTime: (audienceRules: AudienceRule[], messageType?: 'email' | 'sms') => 
    api.post<ApiResponse<{ recommendedTime: string; timezone: string; reasoning: string; alternativeTime: string }>>('/ai/optimal-send-time', { audienceRules, messageType }),
  generateSampleCustomers: (count: number = 10) => 
    api.post<ApiResponse<Customer[]>>('/ai/generate-sample-customers', { count }),
  suggestMessageContent: (campaignType: string, audienceDescription: string) =>
    api.post<ApiResponse<string>>('/ai/suggest-message', { campaignType, audienceDescription }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};

export default api;
