import apiClient from './client';

export type AutopayStatus = 'active' | 'completed' | 'defaulted' | 'suspended' | 'reassigned';

export interface Autopay {
  id: string;
  user_id: string;
  asset_id: string;
  loan_code: string;
  status: AutopayStatus;
  asset_price: number;
  down_payment: number;
  loan_amount: number;
  total_repayable: number;
  interest_rate: number;
  daily_payment: number;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  total_paid: number;
  total_balance: number;
  next_due_date: string | null;
  consecutive_missed_days: number;
  total_missed_days: number;
  last_payment_date: string | null;
  previous_loan_id: string | null;
  previous_user_id: string | null;
  inherited_balance: number | null;
  created_at: string;
  updated_at: string;
  assets?: {
    type: string;
    brand: string;
    model: string;
    plate_number: string;
    color: string;
    condition: string;
  };
}

export const loanApi = {
  getMyLoan: () =>
    apiClient.get<Autopay | null>('/api/loans/my'),
};
