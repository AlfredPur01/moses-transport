export const API_BASE_URL = 'https://moses-transportation-backend.onrender.com';
// Local dev only: export const API_BASE_URL = 'http://172.20.10.3:5000';

export const Config = {
  apiBaseUrl: API_BASE_URL,
  timeout: 30_000,
  tokenKey: 'mt_jwt_token',
} as const;
