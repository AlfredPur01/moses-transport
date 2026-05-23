import { useState } from 'react';

import { uploadApi } from '@/api/upload';
import { getApiErrorMessage } from '@/utils/error';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (imageBase64: string, path: string): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const { data } = await uploadApi.uploadImage(imageBase64, path);
      return data.url;
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error, clearError: () => setError(null) };
}
