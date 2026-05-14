import apiClient from './client';

export interface AvailableAsset {
  id: string;
  asset_code: string;
  type: 'tricycle' | 'motorcycle';
  brand: string;
  model: string;
  color: string;
  plate_number: string;
  condition: 'new' | 'fairly-used';
  market_price: number;
  photos: string[];
  created_at: string;
}

export interface LoanApplication {
  id: string;
  user_id: string;
  asset_id: string;
  payment_frequency: 'daily' | 'weekly';
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  assets?: AvailableAsset;
}

export interface AvailableAssetsResponse {
  assets: AvailableAsset[];
  total: number;
  page: number;
  limit: number;
}

export const assetApi = {
  getAvailable: (params?: { type?: string; page?: number; limit?: number }) =>
    apiClient.get<AvailableAssetsResponse>('/api/assets/available', { params }),

  applyForLoan: (assetId: string, paymentFrequency: 'daily' | 'weekly') =>
    apiClient.post<LoanApplication>('/api/loans/apply', { assetId, paymentFrequency }),

  getMyApplication: () =>
    apiClient.get<LoanApplication | null>('/api/loans/my-application'),
};
