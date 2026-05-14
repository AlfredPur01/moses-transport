// Android emulator: 10.0.2.2 | iOS simulator: localhost | Physical device: your machine's LAN IP
export const API_BASE_URL = 'http://192.168.1.134:5000';

export const Config = {
  apiBaseUrl: API_BASE_URL,
  timeout: 30_000,
  tokenKey: 'mt_jwt_token',
} as const;
