import axios, { AxiosInstance } from 'axios';

let apiInstance: AxiosInstance | null = null;

export function initializeApi(getAccessToken: () => Promise<string>) {
  apiInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
  });

  apiInstance.interceptors.request.use(async (config) => {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
    return config;
  });

  return apiInstance;
}

export function getApi(): AxiosInstance {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeApi first.');
  }
  return apiInstance;
}
