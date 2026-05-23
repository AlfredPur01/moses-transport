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
  payment_frequency: 'daily';
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  assets?: AvailableAsset;
}

export interface AvailableAssetsResponse {
  assets: AvailableAsset[];
  total: number;
  page: number;
  limit: number;
}

export interface MyAsset {
  id: string;
  asset_code: string;
  type: 'tricycle' | 'motorcycle';
  brand: string;
  model: string;
  color: string;
  plate_number: string;
  engine_number?: string;
  chassis_number?: string;
  condition: 'new' | 'fairly-used';
  market_price: number;
  photos: string[];
  assigned_at?: string;
}

export const assetApi = {
  getAvailable: (params?: { type?: string; page?: number; limit?: number }) =>
    apiClient.get<AvailableAssetsResponse>('/api/assets', { params: { ...params, status: 'available' } }),

  getAssetById: (id: string) =>
    apiClient.get<MyAsset>(`/api/assets/${id}`),

  applyForLoan: (assetId: string) =>
    apiClient.post<LoanApplication>(`/api/loans/${assetId}/apply`, { assetId, paymentFrequency: 'daily' }),

  getMyApplication: () =>
    apiClient.get<LoanApplication | null>('/api/loans/my-application'),
};
