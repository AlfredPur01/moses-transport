import apiClient from './client';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  password: string;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  role: 'user' | 'admin' | 'sub-admin';
  status: 'pending' | 'verified' | 'suspended' | 'blacklisted';
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  application_fee_paid: boolean;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  virtual_account_name: string | null;
  wallet_balance: number;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    apiClient.post<{ message: string }>('/api/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload) =>
    apiClient.post<{ message: string }>('/api/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<{ message: string }>('/api/auth/change-password', data),
};
