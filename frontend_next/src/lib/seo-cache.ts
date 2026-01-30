/**
 * SEO Metadata Caching Service
 * Provides caching layer for generated metadata to reduce database queries
 */

import { SEOMetadata, SEOSettings } from './seo-metadata';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface SEOCacheConfig {
  defaultTTL: number;
  maxCacheSize: number;
  enablePersistence: boolean;
}

/**
 * In-memory cache with TTL support and optional persistence
 */
export class SEOCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: SEOCacheConfig;
  private persistenceKey = 'seo-metadata-cache';

  constructor(config: Partial<SEOCacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxCacheSize: 100,
      enablePersistence: false,
      ...config
    };

    // Load from localStorage if persistence is enabled
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      this.loadFromStorage();
    }

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce cache size limit
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.saveToStorage();
    return invalidated;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveToStorage();
    }
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load SEO cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save SEO cache to storage:', error);
    }
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateHitRate(): number {
    // This would need proper tracking in a real implementation
    return 0.85; // Placeholder
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry).length * 2;
    }
    return size;
  }
}

/**
 * Specialized SEO metadata cache with predefined cache keys and TTL
 */
export class SEOMetadataCache extends SEOCache {
  private static instance: SEOMetadataCache;

  constructor() {
    super({
      defaultTTL: 10 * 60 * 1000, // 10 minutes for SEO metadata
      maxCacheSize: 200,
      enablePersistence: true
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SEOMetadataCache {
    if (!SEOMetadataCache.instance) {
      SEOMetadataCache.instance = new SEOMetadataCache();
    }
    return SEOMetadataCache.instance;
  }

  /**
   * Cache global SEO settings
   */
  cacheGlobalSettings(settings: SEOSettings): void {
    this.set('global-settings', settings, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Get cached global SEO settings
   */
  getGlobalSettings(): SEOSettings | null {
    return this.get<SEOSettings>('global-settings');
  }

  /**
   * Cache page metadata
   */
  cachePageMetadata(pageType: string, slug: string | undefined, metadata: SEOMetadata): void {
    const key = this.generatePageKey(pageType, slug);
    this.set(key, metadata, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Get cached page metadata
   */
  getPageMetadata(pageType: string, slug: string | undefined): SEOMetadata | null {
    const key = this.generatePageKey(pageType, slug);
    return this.get<SEOMetadata>(key);
  }

  /**
   * Cache structured data
   */
  cacheStructuredData(pageType: string, slug: string | undefined, structuredData: any): void {
    const key = this.generateStructuredDataKey(pageType, slug);
    this.set(key, structuredData, 20 * 60 * 1000); // 20 minutes
  }

  /**
   * Get cached structured data
   */
  getStructuredData(pageType: string, slug: string | undefined): any | null {
    const key = this.generateStructuredDataKey(pageType, slug);
    return this.get(key);
  }

  /**
   * Invalidate cache for specific content
   */
  invalidateContent(pageType: string, slug?: string): void {
    if (slug) {
      // Invalidate specific page
      const pageKey = this.generatePageKey(pageType, slug);
      const structuredKey = this.generateStructuredDataKey(pageType, slug);
      this.delete(pageKey);
      this.delete(structuredKey);
    } else {
      // Invalidate all pages of this type
      const pattern = new RegExp(`^${pageType}-`);
      this.invalidatePattern(pattern);
    }
  }

  /**
   * Invalidate all SEO cache when global settings change
   */
  invalidateAll(): void {
    this.clear();
  }

  /**
   * Generate cache key for page metadata
   */
  private generatePageKey(pageType: string, slug: string | undefined): string {
    return slug ? `${pageType}-${slug}-metadata` : `${pageType}-metadata`;
  }

  /**
   * Generate cache key for structured data
   */
  private generateStructuredDataKey(pageType: string, slug: string | undefined): string {
    return slug ? `${pageType}-${slug}-structured` : `${pageType}-structured`;
  }
}

/**
 * Cache invalidation service
 */
export class SEOCacheInvalidator {
  private cache: SEOMetadataCache;

  constructor() {
    this.cache = SEOMetadataCache.getInstance();
  }

  /**
   * Invalidate cache when content is updated
   */
  onContentUpdate(contentType: 'project' | 'blog', slug: string): void {
    this.cache.invalidateContent(contentType, slug);
    
    // Also invalidate home page if it might show this content
    this.cache.invalidateContent('home');
    
    console.log(`SEO cache invalidated for ${contentType}: ${slug}`);
  }

  /**
   * Invalidate cache when global settings are updated
   */
  onGlobalSettingsUpdate(): void {
    this.cache.invalidateAll();
    console.log('All SEO cache invalidated due to global settings update');
  }

  /**
   * Invalidate cache when content is deleted
   */
  onContentDelete(contentType: 'project' | 'blog', slug: string): void {
    this.cache.invalidateContent(contentType, slug);
    this.cache.invalidateContent('home');
    
    console.log(`SEO cache invalidated for deleted ${contentType}: ${slug}`);
  }

  /**
   * Scheduled cache cleanup
   */
  scheduleCleanup(): void {
    // Clean up every hour
    setInterval(() => {
      const stats = this.cache.getStats();
      console.log('SEO Cache stats:', stats);
      
      // Force cleanup if memory usage is high
      if (stats.memoryUsage > 1024 * 1024) { // 1MB
        this.cache.clear();
        console.log('SEO cache cleared due to high memory usage');
      }
    }, 60 * 60 * 1000);
  }
}

// Export singleton instances
export const seoCache = SEOMetadataCache.getInstance();
export const seoCacheInvalidator = new SEOCacheInvalidator();

// Initialize cleanup scheduler
if (typeof window !== 'undefined') {
  seoCacheInvalidator.scheduleCleanup();
}