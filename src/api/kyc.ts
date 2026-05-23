import apiClient from './client';

export type IDType = 'nin' | 'voters_card' | 'drivers_license' | 'international_passport';
export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type RelationshipType = 'friend' | 'family' | 'colleague' | 'neighbour' | 'other';

export interface KYCData {
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  marital_status: MaritalStatus | null;
  profile_photo: string | null;
  address: string | null;
  landmark: string | null;
  length_of_stay: string | null;
  previous_address: string | null;
  id_type: IDType | null;
  id_number: string | null;
  id_document_url: string | null;
  nin: string | null;
  years_riding: number | null;
  riders_permit_number: string | null;
  prev_transport_co: string | null;
  installments_done: number;
  existing_obligations: string | null;
  state_of_origin: string | null;
  local_govt: string | null;
  referral_name: string | null;
  referral_phone: string | null;
  referral_address: string | null;
  consent_data_verify: boolean;
  consent_asset_recovery: boolean;
  signature_url: string | null;
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  application_fee_paid: boolean;
}

export interface RelativePayload {
  fullName: string;
  phone: string;
  address?: string;
}

export interface Relative {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string | null;
  created_at: string;
}

export interface GuarantorPayload {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  passportPhoto?: string;
  relationshipType?: RelationshipType;
  yearsOfRelationship?: number;
  houseAddress?: string;
  workplaceAddress?: string;
  stateOfOrigin?: string;
  localGovt?: string;
  idType?: string;
  idNumber?: string;
  occupation?: string;
  employerName?: string;
  consent?: boolean;
}

export interface Guarantor {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  alternate_phone: string | null;
  profile_photo: string | null;
  relationship: RelationshipType | null;
  years_of_relationship: number | null;
  address: string | null;
  workplace_address: string | null;
  state_of_origin: string | null;
  local_govt: string | null;
  id_type: string | null;
  id_number: string | null;
  occupation: string | null;
  employer_name: string | null;
  guarantor_consent: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface KYCSubmitPayload {
  fullName?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  passportPhoto?: string;
  address?: string;
  landmark?: string;
  lengthOfStay?: string;
  previousAddress?: string;
  idType?: IDType;
  idNumber?: string;
  idDocumentUrl?: string;
  yearsRiding?: number;
  ridersPermitNumber?: string;
  prevTransportCo?: string;
  installmentsDone?: number;
  existingObligations?: string;
  stateOfOrigin?: string;
  localGovt?: string;
  referralName?: string;
  referralPhone?: string;
  referralAddress?: string;
  consentDataVerify?: boolean;
  consentAssetRecovery?: boolean;
  signatureUrl?: string;
  relatives?: RelativePayload[];
  guarantor?: GuarantorPayload;
}

export const kycApi = {
  getMyKyc: () =>
    apiClient.get<KYCData>('/api/kyc'),

  submitKyc: (data: KYCSubmitPayload) =>
    apiClient.post<null>('/api/kyc/submit', data),
};
