import apiClient from './client';

export interface KycNinPayload {
  nin: string;
  ninDocUrl?: string;
}

export interface KycSelfiePayload {
  selfieUrl: string;
}

export interface KycAddressPayload {
  address: string;
  stateOfOrigin: string;
  localGovt: string;
  alternatePhone?: string;
}

export interface KycGuarantorPayload {
  fullName: string;
  phone: string;
  relationship: string;
  address: string;
  occupation: string;
  nin: string;
  ninDocUrl?: string;
}

export const kycApi = {
  submitNin: (data: KycNinPayload) =>
    apiClient.post<null>('/api/user/kyc/nin', data),

  submitSelfie: (data: KycSelfiePayload) =>
    apiClient.post<null>('/api/user/kyc/selfie', data),

  submitAddress: (data: KycAddressPayload) =>
    apiClient.post<null>('/api/user/kyc/address', data),

  submitGuarantor: (data: KycGuarantorPayload) =>
    apiClient.post<null>('/api/user/kyc/guarantor', data),
};
