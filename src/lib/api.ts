/**
 * API utility functions for making HTTP requests
 */

// Get the API base URL from environment variables
const getApiBaseUrl = (): string => {
  // In browser environment, use NEXT_PUBLIC_API_BASE_URL
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // In server environment, fallback to localhost
  return 'http://localhost:3003';
};

/**
 * Creates a full API URL by combining base URL with the endpoint
 * @param endpoint - The API endpoint (e.g., '/api/auth/login')
 * @returns Full API URL
 */
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Remove trailing slash from base URL and leading slash from endpoint if both exist
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBaseUrl}${cleanEndpoint}`;
};

/**
 * Enhanced fetch function with automatic URL resolution
 * @param endpoint - The API endpoint
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = createApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};

/**
 * API helper for GET requests
 */
export const apiGet = (endpoint: string, options?: RequestInit) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

/**
 * API helper for POST requests
 */
export const apiPost = (endpoint: string, data?: unknown, options?: RequestInit) => 
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

/**
 * API helper for PUT requests
 */
export const apiPut = (endpoint: string, data?: unknown, options?: RequestInit) => 
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

/**
 * API helper for DELETE requests
 */
export const apiDelete = (endpoint: string, options?: RequestInit) => 
  apiFetch(endpoint, { ...options, method: 'DELETE' });