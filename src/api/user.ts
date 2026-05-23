import apiClient from './client';

import { Autopay } from './loan';
import { AuthUser } from './auth';

// UserProfile is an alias for AuthUser — kept so existing imports don't break
export type UserProfile = AuthUser;

export interface Payment {
  id: string;
  loan_id?: string;
  user_id?: string;
  payment_code: string;
  amount: number;
  payment_date: string;
  method: 'virtual_account' | 'cash' | 'transfer' | 'pos' | 'wallet';
  reference?: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'reversed';
  confirmed_at?: string | null;
  balance_after: number | null;
  created_at?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  status?: 'pending' | 'sent' | 'failed' | 'read';
  created_at: string;
  sent_at?: string;
  read_at?: string;
  metadata?: { loanId?: string; paymentId?: string; amount?: number };
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'deduction';
  amount: number;
  fee: number;
  net_amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  created_at: string;
}

export interface InitiatePaymentPayload {
  amount: number;
  method: 'virtual_account' | 'transfer' | 'cash' | 'pos';
}

export interface InitiatePaymentResult {
  payment_code: string;
  status: string;
  redirect_url?: string;
  ussd_code?: string;
  account_number?: string;
  bank_name?: string;
}

export interface DashboardData {
  user: AuthUser;
  loan: Autopay | null;
  recentPayments: Payment[];
}

export interface PaymentHistory {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
  address?: string;
  alternate_phone?: string;
  profile_photo?: string;
}

export interface PayNowResult {
  deducted: number;
  dueAmount: number;
  isPartial: boolean;
  walletBalanceAfter: number;
  newLoanBalance: number;
  isCompleted: boolean;
}

export const userApi = {
  getProfile: () =>
    apiClient.get<AuthUser>('/api/auth/me'),

  getDashboard: () =>
    apiClient.get<DashboardData>('/api/user/dashboard'),

  getPayments: (page = 1, limit = 20) =>
    apiClient.get<PaymentHistory>('/api/user/payments', { params: { page, limit } }),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put<AuthUser>('/api/user/profile', data),

  syncPayments: () =>
    apiClient.post<{ synced: number }>('/api/user/sync-payments'),

  payNow: () =>
    apiClient.post<PayNowResult>('/api/user/pay-now'),

  initiatePayment: (data: InitiatePaymentPayload) =>
    apiClient.post<InitiatePaymentResult>('/api/payments/initiate', data),

  getPaymentReceipt: (paymentCode: string) =>
    apiClient.get<Payment>(`/api/payments/${paymentCode}`),

  getNotifications: () =>
    apiClient.get<Notification[]>('/api/user/notifications'),

  markNotificationRead: (id: string) =>
    apiClient.put<void>(`/api/user/notifications/${id}/read`),
};
