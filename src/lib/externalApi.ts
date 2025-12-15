/**
 * External API Client for Self-Hosted Backend
 * 
 * Hybrid Architecture:
 * - Lovable Cloud: Auth, Products, Categories, Content
 * - Self-Hosted: Orders, Customers, Payments, Addresses
 */

import { supabase } from '@/integrations/supabase/client';

// External API base URL - configure in environment
const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || '';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Get current user's JWT token from Supabase for API authentication
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make authenticated request to external API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  if (!EXTERNAL_API_URL) {
    console.warn('VITE_EXTERNAL_API_URL not configured, using Lovable Cloud');
    return { data: null, error: 'External API not configured' };
  }

  try {
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${EXTERNAL_API_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        data: null, 
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('External API request failed:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Check if external API is configured and available
 */
export function isExternalApiConfigured(): boolean {
  return Boolean(EXTERNAL_API_URL);
}

/**
 * Get external API URL for display
 */
export function getExternalApiUrl(): string {
  return EXTERNAL_API_URL;
}
