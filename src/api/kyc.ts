import apiClient from './client';

export type Gender          = 'male' | 'female' | 'other';
export type MaritalStatus   = 'single' | 'married' | 'divorced' | 'widowed';
export type IDType          = 'nin' | 'voters_card' | 'drivers_license' | 'international_passport';
export type RelationshipType = 'friend' | 'family' | 'colleague' | 'neighbour' | 'other';

export interface RelativePayload {
  fullName: string;
  phone:    string;
  address?: string;
}

export interface GuarantorPayload {
  fullName:            string;
  phone:               string;
  alternatePhone?:     string;
  passportPhoto?:      string;
  relationshipType?:   RelationshipType;
  yearsOfRelationship?: number;
  houseAddress?:       string;
  workplaceAddress?:   string;
  stateOfOrigin?:      string;
  localGovt?:          string;
  idType?:             string;
  idNumber?:           string;
  occupation?:         string;
  employerName?:       string;
  consent:             boolean;
}

export interface KYCSubmitPayload {
  // Personal
  fullName?:       string;
  dateOfBirth?:    string;
  gender?:         Gender;
  maritalStatus?:  MaritalStatus;
  passportPhoto?:  string;
  // Address
  address?:        string;
  landmark?:       string;
  lengthOfStay?:   string;
  previousAddress?: string;
  // Identification
  idType?:         IDType;
  idNumber?:       string;
  idDocumentUrl?:  string;
  // Experience
  yearsRiding?:    number;
  ridersPermitNumber?: string;
  prevTransportCo?: string;
  installmentsDone?: number;
  existingObligations?: string;
  // Background
  stateOfOrigin?:  string;
  localGovt?:      string;
  referralName?:   string;
  referralPhone?:  string;
  referralAddress?: string;
  // Consent
  consentDataVerify?:    boolean;
  consentAssetRecovery?: boolean;
  signatureUrl?:   string;
  // Relations
  relatives?:      RelativePayload[];
  guarantors?:     GuarantorPayload[];
}

export interface KYCRecord {
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  [key: string]: any;
}

export const kycApi = {
  submitKyc: (data: KYCSubmitPayload) =>
    apiClient.post<null>('/api/kyc/submit', data),

  getMyKyc: () =>
    apiClient.get<KYCRecord>('/api/kyc'),
};
