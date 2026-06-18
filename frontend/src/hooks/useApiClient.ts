import axios, { AxiosError, AxiosInstance } from 'axios';
import { QueryClient } from '@tanstack/react-query';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Determines whether a failed request should be retried.
 * Retries on 5xx server errors and timeout errors.
 * Does NOT retry on 4xx client errors.
 */
function shouldRetry(error: AxiosError): boolean {
  // Retry on timeout (no response received)
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on 5xx server errors
  const status = error.response.status;
  return status >= 500;
}

/**
 * Calculates exponential backoff delay: 1s, 2s, 4s
 */
function getBackoffDelay(retryCount: number): number {
  return INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
}

/**
 * Waits for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates an Axios instance with 10-second timeout and exponential backoff retry logic.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config;

      if (!config) {
        return Promise.reject(error);
      }

      // Track retry count on the config object
      const retryState = (config as unknown as Record<string, unknown>).__retryCount as number | undefined;
      const retryCount = retryState ?? 0;

      if (retryCount >= MAX_RETRIES || !shouldRetry(error)) {
        return Promise.reject(error);
      }

      // Increment retry count
      (config as unknown as Record<string, unknown>).__retryCount = retryCount + 1;

      // Wait with exponential backoff
      const backoff = getBackoffDelay(retryCount);
      await delay(backoff);

      // Retry the request
      return client(config);
    }
  );

  return client;
}

/** Singleton Axios API client instance */
export const apiClient = createApiClient();

/** TanStack Query client with session-level caching defaults */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - session-level caching
      retry: false, // Retry handled by Axios interceptor
      refetchOnWindowFocus: false,
    },
  },
});

export { shouldRetry, getBackoffDelay, createApiClient };
