import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { Config } from '@/constants/config';
import { authRef } from '@/context/authRef';

const apiClient = axios.create({
  baseURL: Config.apiBaseUrl,
  timeout: Config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(Config.tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    // Unwrap backend envelope: { success, message, data }
    if (body && typeof body === 'object' && 'success' in body) {
      return { ...response, data: body.data };
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await (authRef.logout?.() ?? AsyncStorage.removeItem(Config.tokenKey));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
