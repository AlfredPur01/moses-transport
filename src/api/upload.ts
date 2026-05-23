import apiClient from './client';

export interface UploadResponse {
  url: string;
  path: string;
}

export const uploadApi = {
  uploadImage: (imageBase64: string, path: string) =>
    apiClient.post<UploadResponse>('/api/upload', { imageBase64, path }),
};
