import apiClient from './client';

export interface MyLoan {
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
}

export const loanApi = {
  getMyLoan: () =>
    apiClient.get<MyLoan | null>('/api/loans/my'),
};
