/**
 * SEO Performance Monitoring Service
 * Tracks performance metrics for SEO metadata generation and optimization
 */

export interface SEOPerformanceMetrics {
  metadataGenerationTime: number;
  cacheHitRate: number;
  imageOptimizationTime: number;
  structuredDataGenerationTime: number;
  totalRequestTime: number;
  memoryUsage: number;
  errorRate: number;
}

export interface PerformanceEntry {
  timestamp: number;
  operation: string;
  duration: number;
  success: boolean;
  cacheHit?: boolean;
  metadata?: any;
}

/**
 * Performance monitoring service for SEO operations
 */
export class SEOPerformanceMonitor {
  private static instance: SEOPerformanceMonitor;
  private metrics: PerformanceEntry[] = [];
  private maxEntries = 1000;
  private isEnabled = process.env.NODE_ENV === 'development';

  private constructor() {
    // Clean up old entries periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    }
  }

  static getInstance(): SEOPerformanceMonitor {
    if (!SEOPerformanceMonitor.instance) {
      SEOPerformanceMonitor.instance = new SEOPerformanceMonitor();
    }
    return SEOPerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operation: string): (success?: boolean, metadata?: any) => void {
    if (!this.isEnabled) {
      return () => { };
    }

    const startTime = performance.now();

    return (success: boolean = true, metadata?: any) => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        timestamp: Date.now(),
        operation,
        duration,
        success,
        metadata
      });
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(entry: PerformanceEntry): void {
    if (!this.isEnabled) return;

    this.metrics.push(entry);

    // Keep only recent entries
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries);
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(operation: string, hit: boolean, duration: number = 0): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      timestamp: Date.now(),
      operation: `cache-${operation}`,
      duration,
      success: true,
      cacheHit: hit
    });
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow: number = 60 * 60 * 1000): SEOPerformanceMetrics {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return this.getDefaultMetrics();
    }

    const metadataOps = recentMetrics.filter(m => m.operation.includes('metadata'));
    const cacheOps = recentMetrics.filter(m => m.operation.includes('cache'));
    const imageOps = recentMetrics.filter(m => m.operation.includes('image'));
    const structuredOps = recentMetrics.filter(m => m.operation.includes('structured'));

    return {
      metadataGenerationTime: this.getAverageDuration(metadataOps),
      cacheHitRate: this.getCacheHitRate(cacheOps),
      imageOptimizationTime: this.getAverageDuration(imageOps),
      structuredDataGenerationTime: this.getAverageDuration(structuredOps),
      totalRequestTime: this.getAverageDuration(recentMetrics),
      memoryUsage: this.estimateMemoryUsage(),
      errorRate: this.getErrorRate(recentMetrics)
    };
  }

  /**
   * Get detailed performance report
   */
  getDetailedReport(timeWindow: number = 60 * 60 * 1000): {
    summary: SEOPerformanceMetrics;
    slowestOperations: PerformanceEntry[];
    errorOperations: PerformanceEntry[];
    cacheStats: {
      hits: number;
      misses: number;
      hitRate: number;
    };
  } {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const slowestOperations = recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const errorOperations = recentMetrics.filter(m => !m.success);

    const cacheOps = recentMetrics.filter(m => m.operation.includes('cache'));
    const cacheHits = cacheOps.filter(m => m.cacheHit).length;
    const cacheMisses = cacheOps.filter(m => !m.cacheHit).length;

    return {
      summary: this.getStats(timeWindow),
      slowestOperations,
      errorOperations,
      cacheStats: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: cacheOps.length > 0 ? cacheHits / cacheOps.length : 0
      }
    };
  }

  /**
   * Log performance warning if operation is slow
   */
  checkPerformanceThreshold(operation: string, duration: number): void {
    const thresholds = {
      'metadata-generation': 100, // 100ms
      'image-optimization': 500,  // 500ms
      'structured-data': 50,      // 50ms
      'cache-access': 10          // 10ms
    };

    const threshold = thresholds[operation as keyof typeof thresholds] || 200;

    if (duration > threshold) {
      console.warn(`SEO Performance Warning: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.getStats()
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private getAverageDuration(metrics: PerformanceEntry[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  private getCacheHitRate(cacheMetrics: PerformanceEntry[]): number {
    if (cacheMetrics.length === 0) return 0;
    const hits = cacheMetrics.filter(m => m.cacheHit).length;
    return hits / cacheMetrics.length;
  }

  private getErrorRate(metrics: PerformanceEntry[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => !m.success).length;
    return errors / metrics.length;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    return this.metrics.length * 200; // ~200 bytes per entry
  }

  private getDefaultMetrics(): SEOPerformanceMetrics {
    return {
      metadataGenerationTime: 0,
      cacheHitRate: 0,
      imageOptimizationTime: 0,
      structuredDataGenerationTime: 0,
      totalRequestTime: 0,
      memoryUsage: 0,
      errorRate: 0
    };
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
  }
}

/**
 * Performance decorator for SEO operations
 */
export function withSEOPerformanceTracking<T extends (...args: any[]) => any>(
  operation: string,
  fn: T
): T {
  const monitor = SEOPerformanceMonitor.getInstance();

  return ((...args: any[]) => {
    const endTiming = monitor.startTiming(operation);

    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            endTiming(true, { args, result: value });
            return value;
          })
          .catch((error) => {
            endTiming(false, { args, error: error.message });
            throw error;
          });
      }

      // Handle sync functions
      endTiming(true, { args, result });
      return result;
    } catch (error) {
      endTiming(false, { args, error: (error as Error).message });
      throw error;
    }
  }) as T;
}

/**
 * React hook for SEO performance monitoring
 */
export function useSEOPerformanceMonitor() {
  const monitor = SEOPerformanceMonitor.getInstance();

  return {
    startTiming: monitor.startTiming.bind(monitor),
    recordMetric: monitor.recordMetric.bind(monitor),
    recordCacheAccess: monitor.recordCacheAccess.bind(monitor),
    getStats: monitor.getStats.bind(monitor),
    getDetailedReport: monitor.getDetailedReport.bind(monitor),
    exportMetrics: monitor.exportMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor)
  };
}

// Export singleton instance
export const seoPerformanceMonitor = SEOPerformanceMonitor.getInstance();