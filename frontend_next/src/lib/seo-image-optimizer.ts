/**
 * SEO Image Optimization Service
 * Handles optimized image processing and delivery for social media
 */

import { seoPerformanceMonitor } from './seo-performance-monitor';

export interface ImageOptimizationOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpg' | 'png' | 'webp';
  fit: 'cover' | 'contain' | 'fill';
}

export interface OptimizedImageResult {
  url: string;
  width: number;
  height: number;
  format: string;
  size?: number;
  cached: boolean;
}

/**
 * Client-side image optimization service for SEO
 */
export class SEOImageOptimizer {
  private static instance: SEOImageOptimizer;
  private cache = new Map<string, OptimizedImageResult>();
  private readonly maxCacheSize = 50;
  private readonly apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  private constructor() {
    // Clean up cache periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupCache(), 10 * 60 * 1000); // Every 10 minutes
    }
  }

  static getInstance(): SEOImageOptimizer {
    if (!SEOImageOptimizer.instance) {
      SEOImageOptimizer.instance = new SEOImageOptimizer();
    }
    return SEOImageOptimizer.instance;
  }

  /**
   * Optimize image for social media platforms
   */
  async optimizeForSocialMedia(
    imagePath: string,
    platform: 'openGraph' | 'twitter' | 'facebook' | 'linkedin',
    options?: Partial<ImageOptimizationOptions>
  ): Promise<OptimizedImageResult> {
    const endTiming = seoPerformanceMonitor.startTiming('image-optimization');
    
    try {
      const optimizationOptions = this.getPlatformOptions(platform, options);
      const cacheKey = this.generateCacheKey(imagePath, optimizationOptions);
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        seoPerformanceMonitor.recordCacheAccess('image-optimization', true);
        endTiming();
        return cached;
      }

      seoPerformanceMonitor.recordCacheAccess('image-optimization', false);
      
      // Generate optimized image URL
      const optimizedUrl = this.generateOptimizedUrl(imagePath, optimizationOptions);
      
      // Validate image exists and get metadata
      const metadata = await this.validateAndGetMetadata(optimizedUrl);
      
      const result: OptimizedImageResult = {
        url: optimizedUrl,
        width: optimizationOptions.width,
        height: optimizationOptions.height,
        format: optimizationOptions.format,
        size: metadata.size,
        cached: false
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      endTiming();
      return result;
    } catch {
      endTiming();
      
      // Return fallback result
      return this.getFallbackResult(imagePath, platform);
    }
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimize(
    images: Array<{
      path: string;
      platform: 'openGraph' | 'twitter' | 'facebook' | 'linkedin';
      options?: Partial<ImageOptimizationOptions>;
    }>
  ): Promise<OptimizedImageResult[]> {
    const endTiming = seoPerformanceMonitor.startTiming('batch-image-optimization');
    
    try {
      const promises = images.map(({ path, platform, options }) =>
        this.optimizeForSocialMedia(path, platform, options)
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results
        .filter((result): result is PromiseFulfilledResult<OptimizedImageResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      endTiming();
      
      return successful;
    } catch {
      endTiming();
      return [];
    }
  }

  /**
   * Preload critical SEO images
   */
  async preloadCriticalImages(imagePaths: string[]): Promise<void> {
    const endTiming = seoPerformanceMonitor.startTiming('image-preload');
    
    try {
      const criticalPlatforms: Array<'openGraph' | 'twitter'> = ['openGraph', 'twitter'];
      const preloadPromises: Promise<OptimizedImageResult>[] = [];
      
      for (const imagePath of imagePaths) {
        for (const platform of criticalPlatforms) {
          preloadPromises.push(
            this.optimizeForSocialMedia(imagePath, platform)
          );
        }
      }
      
      await Promise.allSettled(preloadPromises);
      endTiming();
    } catch {
      endTiming();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0.75, // Placeholder - would need proper tracking
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get platform-specific optimization options
   */
  private getPlatformOptions(
    platform: 'openGraph' | 'twitter' | 'facebook' | 'linkedin',
    overrides?: Partial<ImageOptimizationOptions>
  ): ImageOptimizationOptions {
    const platformDefaults = {
      openGraph: { width: 1200, height: 630, quality: 85, format: 'jpg' as const, fit: 'cover' as const },
      twitter: { width: 1200, height: 675, quality: 85, format: 'jpg' as const, fit: 'cover' as const },
      facebook: { width: 1200, height: 630, quality: 85, format: 'jpg' as const, fit: 'cover' as const },
      linkedin: { width: 1200, height: 627, quality: 85, format: 'jpg' as const, fit: 'cover' as const }
    };

    return {
      ...platformDefaults[platform],
      ...overrides
    };
  }

  /**
   * Generate cache key for optimization options
   */
  private generateCacheKey(imagePath: string, options: ImageOptimizationOptions): string {
    return `${imagePath}-${options.width}x${options.height}-${options.quality}-${options.format}-${options.fit}`;
  }

  /**
   * Generate optimized image URL
   */
  private generateOptimizedUrl(imagePath: string, options: ImageOptimizationOptions): string {
    // Normalize image path
    let normalizedPath = imagePath;
    if (imagePath.startsWith('/storage/')) {
      normalizedPath = imagePath.replace('/storage/', '');
    } else if (imagePath.startsWith('/')) {
      normalizedPath = imagePath.substring(1);
    }

    // Build optimization URL with query parameters
    const params = new URLSearchParams({
      path: normalizedPath,
      w: options.width.toString(),
      h: options.height.toString(),
      q: options.quality.toString(),
      f: options.format,
      fit: options.fit
    });

    return `${this.apiUrl}/api/images/optimize?${params.toString()}`;
  }

  /**
   * Validate image exists and get metadata
   */
  private async validateAndGetMetadata(url: string): Promise<{ size?: number }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Image validation failed: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      return {
        size: contentLength ? parseInt(contentLength, 10) : undefined
      };
    } catch (error) {
      console.warn('Image validation failed:', error);
      return {};
    }
  }

  /**
   * Get fallback result when optimization fails
   */
  private getFallbackResult(imagePath: string, platform: string): OptimizedImageResult {
    // Return original image as fallback
    const baseUrl = this.apiUrl;
    let fallbackUrl = imagePath;
    
    if (!imagePath.startsWith('http')) {
      if (imagePath.startsWith('/storage/')) {
        fallbackUrl = `${baseUrl}${imagePath}`;
      } else if (imagePath.startsWith('/')) {
        fallbackUrl = `${baseUrl}/storage${imagePath}`;
      } else {
        fallbackUrl = `${baseUrl}/storage/${imagePath}`;
      }
    }

    const platformDefaults = {
      openGraph: { width: 1200, height: 630 },
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
      linkedin: { width: 1200, height: 627 }
    };

    const defaults = platformDefaults[platform as keyof typeof platformDefaults] || { width: 1200, height: 630 };

    return {
      url: fallbackUrl,
      width: defaults.width,
      height: defaults.height,
      format: 'jpg',
      cached: false
    };
  }

  /**
   * Cache optimization result
   */
  private cacheResult(key: string, result: OptimizedImageResult): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { ...result, cached: true });
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    // Simple cleanup - remove half the entries when cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxCacheSize / 2));
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, value] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(value).length * 2;
    }
    return size;
  }
}

/**
 * React hook for SEO image optimization
 */
export function useSEOImageOptimizer() {
  const optimizer = SEOImageOptimizer.getInstance();

  return {
    optimizeForSocialMedia: optimizer.optimizeForSocialMedia.bind(optimizer),
    batchOptimize: optimizer.batchOptimize.bind(optimizer),
    preloadCriticalImages: optimizer.preloadCriticalImages.bind(optimizer),
    getCacheStats: optimizer.getCacheStats.bind(optimizer),
    clearCache: optimizer.clearCache.bind(optimizer)
  };
}

// Export singleton instance
export const seoImageOptimizer = SEOImageOptimizer.getInstance();