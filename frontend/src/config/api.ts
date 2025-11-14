// frontend/src/config/api.ts
// Centralized API configuration using environment variables

/**
 * Base API URL from environment variable
 * Falls back to localhost for development if not set
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/**
 * Helper to construct full API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

console.log('🌐 [API Config] Using API Base URL:', API_BASE_URL);
