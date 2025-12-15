/**
 * Hybrid Data Hook
 * 
 * Provides unified access to data regardless of source:
 * - Lovable Cloud (Supabase): Products, Categories, Auth, Content
 * - Self-Hosted API: Orders, Customers, Payments
 * 
 * Automatically falls back to Supabase if external API is not configured
 */

import { isExternalApiConfigured, getExternalApiUrl } from '@/lib/externalApi';

export type DataSource = 'lovable-cloud' | 'self-hosted' | 'hybrid';

export interface HybridConfig {
  source: DataSource;
  externalApiUrl: string | null;
  tables: {
    // Lovable Cloud (always)
    products: 'lovable-cloud';
    categories: 'lovable-cloud';
    brands: 'lovable-cloud';
    reviews: 'lovable-cloud';
    favorites: 'lovable-cloud';
    site_settings: 'lovable-cloud';
    blog_posts: 'lovable-cloud';
    pages: 'lovable-cloud';
    stories: 'lovable-cloud';
    // Configurable (self-hosted if available)
    orders: DataSource;
    order_items: DataSource;
    profiles: DataSource;
    saved_addresses: DataSource;
    loyalty_transactions: DataSource;
  };
}

/**
 * Get current hybrid configuration
 */
export function useHybridConfig(): HybridConfig {
  const externalConfigured = isExternalApiConfigured();
  const criticalDataSource: DataSource = externalConfigured ? 'self-hosted' : 'lovable-cloud';

  return {
    source: externalConfigured ? 'hybrid' : 'lovable-cloud',
    externalApiUrl: externalConfigured ? getExternalApiUrl() : null,
    tables: {
      // Always Lovable Cloud
      products: 'lovable-cloud',
      categories: 'lovable-cloud',
      brands: 'lovable-cloud',
      reviews: 'lovable-cloud',
      favorites: 'lovable-cloud',
      site_settings: 'lovable-cloud',
      blog_posts: 'lovable-cloud',
      pages: 'lovable-cloud',
      stories: 'lovable-cloud',
      // Critical data - self-hosted if configured
      orders: criticalDataSource,
      order_items: criticalDataSource,
      profiles: criticalDataSource,
      saved_addresses: criticalDataSource,
      loyalty_transactions: criticalDataSource,
    },
  };
}

/**
 * Check if running in hybrid mode
 */
export function useIsHybridMode(): boolean {
  return isExternalApiConfigured();
}

/**
 * Get human-readable data source description
 */
export function getDataSourceLabel(source: DataSource): string {
  switch (source) {
    case 'lovable-cloud':
      return 'Lovable Cloud';
    case 'self-hosted':
      return 'Self-Hosted Server';
    case 'hybrid':
      return 'Hybrid (Cloud + Self-Hosted)';
  }
}
