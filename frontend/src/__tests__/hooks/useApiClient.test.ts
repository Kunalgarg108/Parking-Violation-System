import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockInstance),
    },
  };
});

// We need to test the retry logic directly via the interceptor
// Let's import the utility functions and test them
describe('useApiClient - shouldRetry', () => {
  let shouldRetry: (error: AxiosError) => boolean;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../hooks/useApiClient');
    shouldRetry = mod.shouldRetry;
  });

  it('should retry on 500 server error', () => {
    const error = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry on 502 server error', () => {
    const error = new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 502,
      statusText: 'Bad Gateway',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry on 503 server error', () => {
    const error = new AxiosError('Service Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(true);
  });

  it('should NOT retry on 400 client error', () => {
    const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(false);
  });

  it('should NOT retry on 401 unauthorized', () => {
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(false);
  });

  it('should NOT retry on 404 not found', () => {
    const error = new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(false);
  });

  it('should NOT retry on 422 unprocessable entity', () => {
    const error = new AxiosError('Unprocessable Entity', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(shouldRetry(error)).toBe(false);
  });

  it('should retry on timeout (ECONNABORTED)', () => {
    const error = new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED');
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry on timeout (ETIMEDOUT)', () => {
    const error = new AxiosError('Connection timed out', 'ETIMEDOUT');
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry on network error (no response)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(shouldRetry(error)).toBe(true);
  });
});

describe('useApiClient - getBackoffDelay', () => {
  let getBackoffDelay: (retryCount: number) => number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../hooks/useApiClient');
    getBackoffDelay = mod.getBackoffDelay;
  });

  it('should return 1000ms for first retry (index 0)', () => {
    expect(getBackoffDelay(0)).toBe(1000);
  });

  it('should return 2000ms for second retry (index 1)', () => {
    expect(getBackoffDelay(1)).toBe(2000);
  });

  it('should return 4000ms for third retry (index 2)', () => {
    expect(getBackoffDelay(2)).toBe(4000);
  });
});

describe('useApiClient - Axios instance configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should create Axios instance with 10-second timeout', async () => {
    const createSpy = vi.mocked(axios.create);
    createSpy.mockClear();

    await import('../../hooks/useApiClient');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 10000,
      })
    );
  });

  it('should configure response interceptor for retry logic', async () => {
    const createSpy = vi.mocked(axios.create);
    const mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
    createSpy.mockReturnValue({
      get: vi.fn(),
      interceptors: mockInterceptors,
    } as unknown as ReturnType<typeof axios.create>);

    await import('../../hooks/useApiClient');

    expect(mockInterceptors.response.use).toHaveBeenCalledTimes(1);
    expect(mockInterceptors.response.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });
});

describe('useApiClient - QueryClient configuration', () => {
  let queryClient: { getDefaultOptions: () => { queries?: { staleTime?: number | ((...args: unknown[]) => number); retry?: boolean; refetchOnWindowFocus?: boolean } } };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../hooks/useApiClient');
    queryClient = mod.queryClient as unknown as typeof queryClient;
  });

  it('should have staleTime set for session caching', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('should disable TanStack Query built-in retry (handled by Axios)', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.retry).toBe(false);
  });

  it('should disable refetch on window focus', () => {
    const options = queryClient.getDefaultOptions();
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });
});

describe('useApiClient - Retry interceptor integration', () => {
  let errorHandler: (error: AxiosError) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const mockClient = {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    vi.mocked(axios.create).mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

    await import('../../hooks/useApiClient');

    // Extract the error handler registered with the interceptor
    const responseUseCall = mockClient.interceptors.response.use.mock.calls[0];
    errorHandler = responseUseCall[1];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reject immediately for 4xx errors without retrying', async () => {
    const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', { headers: new AxiosHeaders() } as never, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });

    await expect(errorHandler(error)).rejects.toThrow();
  });

  it('should reject when config is missing', async () => {
    const error = new AxiosError('No config', 'ERR_BAD_RESPONSE');
    // AxiosError without config
    error.config = undefined;

    await expect(errorHandler(error)).rejects.toThrow();
  });

  it('should reject after max retries exceeded', async () => {
    const config = { headers: new AxiosHeaders(), __retryCount: 3 };
    const error = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', config as never, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    });

    await expect(errorHandler(error)).rejects.toThrow();
  });
});
