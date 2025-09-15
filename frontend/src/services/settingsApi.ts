import { AxiosResponse } from 'axios';
import api from '../utils/api';

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  campaignUpdates: boolean;
  orderUpdates: boolean;
  systemAlerts: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  dataSharing: boolean;
  analytics: boolean;
}

export interface ApiConfigSettings {
  webhookUrl: string;
  apiKey: string;
  rateLimitPerHour: number;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR';
}

export interface IntegrationSettings {
  emailProvider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  smsProvider: 'twilio' | 'nexmo' | 'aws-sns';
  paymentProvider: 'stripe' | 'paypal' | 'square';
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
}

export interface UserSettings {
  _id?: string;
  userId: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  apiConfig: ApiConfigSettings;
  display: DisplaySettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get user settings
export const getSettings = (): Promise<AxiosResponse<ApiResponse<UserSettings>>> => {
  return api.get('/settings');
};

// Update all settings
export const updateSettings = (settings: Partial<UserSettings>): Promise<AxiosResponse<ApiResponse<UserSettings>>> => {
  return api.put('/settings', settings);
};

// Update specific setting section
export const updateSettingSection = (
  section: keyof Omit<UserSettings, '_id' | 'userId' | 'createdAt' | 'updatedAt'>,
  data: any
): Promise<AxiosResponse<ApiResponse<UserSettings>>> => {
  return api.put(`/settings/${section}`, data);
};

// Reset settings to default
export const resetSettings = (): Promise<AxiosResponse<ApiResponse<UserSettings>>> => {
  return api.post('/settings/reset');
};

// Generate new API key
export const generateApiKey = (): Promise<AxiosResponse<ApiResponse<{ apiKey: string }>>> => {
  return api.post('/settings/generate-api-key');
};
