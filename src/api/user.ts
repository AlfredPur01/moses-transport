import apiClient from './client';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  alternate_phone?: string;
  address?: string;
  state_of_origin?: string;
  local_govt?: string;
  nin?: string;
  nin_verified?: boolean;
  profile_photo?: string;
  role: string;
  status: string;
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  virtual_account_number?: string;
  virtual_bank_name?: string;
  virtual_account_name?: string;
  wallet_balance?: number;
  created_at?: string;
}

export interface LoanAsset {
  type: string;
  brand: string;
  model: string;
  plate_number: string;
  color: string;
  condition: string;
}

export interface ActiveLoan {
  id: string;
  loan_code: string;
  status: string;
  asset_price: number;
  total_repayable: number;
  total_paid: number;
  total_balance: number;
  daily_payment: number;
  next_due_date: string;
  start_date: string;
  expected_end_date: string;
  consecutive_missed_days: number;
  assets: LoanAsset;
}

export interface Payment {
  id: string;
  payment_code: string;
  amount: number;
  payment_date: string;
  method: string;
  status: string;
  balance_after: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export interface DashboardData {
  user: UserProfile;
  loan: ActiveLoan | null;
  recentPayments: Payment[];
  notifications: Notification[];
}

export interface PaymentHistory {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateProfilePayload {
  email?: string;
  address?: string;
  alternatePhone?: string;
  profilePhoto?: string;
}

export const userApi = {
  getProfile: () =>
    apiClient.get<UserProfile>('/api/auth/me'),

  getDashboard: () =>
    apiClient.get<DashboardData>('/api/user/dashboard'),

  getPayments: (page = 1, limit = 20) =>
    apiClient.get<PaymentHistory>('/api/user/payments', { params: { page, limit } }),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put<UserProfile>('/api/user/profile', data),

  syncPayments: () =>
    apiClient.post<{ synced: number }>('/api/user/sync-payments'),

  payNow: () =>
    apiClient.post<{
      deducted: number;
      dueAmount: number;
      isPartial: boolean;
      walletBalance: number;
      loanBalance: number;
      loanCompleted: boolean;
    }>('/api/user/pay-now'),
};
