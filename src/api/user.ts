import apiClient from './client';

export interface UserProfile {
  id: string;
  user_code?: string;
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
  kyc_admin_note?: string | null;
  application_fee_paid?: boolean;
  virtual_account_number?: string;
  virtual_bank_name?: string;
  virtual_account_name?: string;
  wallet_balance?: number;
  created_at?: string;
}

export interface KycData extends UserProfile {
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  landmark?: string;
  length_of_stay?: string;
  previous_address?: string;
  id_type?: string;
  id_number?: string;
  id_document_url?: string;
  years_riding?: number;
  riders_permit_number?: string;
  prev_transport_co?: string;
  installments_done?: number;
  existing_obligations?: string;
  referral_name?: string;
  referral_phone?: string;
  referral_address?: string;
  consent_data_verify?: boolean;
  consent_asset_recovery?: boolean;
  signature_url?: string;
  guarantors: { id: string; full_name: string; phone: string }[];
  relatives: { id: string; full_name: string; phone: string }[];
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
  is_read: boolean;
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

export type VehicleType = 'motorcycle' | 'tricycle';

export interface FeeInitResponse {
  reference:          string;
  amount:             number;
  platform_fee:       number;
  total_amount:       number;
  vehicle_type:       VehicleType;
  account_number:     string;
  account_name:       string;
  bank_name:          string;
  account_expires_at: string;
}

export interface FeeVerifyResponse {
  paid: boolean;
}

export const userApi = {
  getProfile: () =>
    apiClient.get<UserProfile>('/api/auth/me'),

  getKycData: () =>
    apiClient.get<KycData>('/api/kyc'),

  initializeFeePayment: (vehicleType: VehicleType) =>
    apiClient.post<FeeInitResponse>('/api/payments/initialize-fee', { vehicleType }),

  verifyFeePayment: (reference: string) =>
    apiClient.post<FeeVerifyResponse>('/api/payments/verify-fee', { reference }),

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

  savePushToken: (pushToken: string) =>
    apiClient.put<null>('/api/user/push-token', { pushToken }),

  getNotifications: () =>
    apiClient.get<Notification[]>('/api/user/notifications'),

  markNotificationRead: (id: string) =>
    apiClient.put<null>(`/api/user/notifications/${id}/read`),
};
