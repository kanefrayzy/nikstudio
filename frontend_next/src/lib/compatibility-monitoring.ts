/**
 * Compatibility Monitoring and Reporting System
 * Tracks browser usage, feature support, errors, and performance impact
 */

import { BrowserInfo, browserDetectionService } from './browser-detection';
import { CompatibilityError } from './compatibility-error-handler';

export interface BrowserUsageMetrics {
  browserName: string;
  browserVersion: number;
  isSupported: boolean;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  pageUrl: string;
  referrer: string;
  screenResolution: string;
  viewportSize: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
}

export interface FeatureSupportMetrics {
  feature: string;
  isSupported: boolean;
  polyfillLoaded: boolean;
  polyfillName?: string;
  loadTime?: number;
  browserInfo: BrowserInfo;
  timestamp: number;
  sessionId: string;
}

export interface CompatibilityErrorMetrics {
  errorId: string;
  type: CompatibilityError['type'];
  feature: string;
  severity: CompatibilityError['severity'];
  message: string;
  fallbackApplied: boolean;
  browserInfo: BrowserInfo;
  timestamp: number;
  sessionId: string;
  pageUrl: string;
  stackTrace?: string;
  userImpact: 'none' | 'minor' | 'moderate' | 'severe';
}

export interface PerformanceMetrics {
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  category: 'polyfill' | 'fallback' | 'detection' | 'rendering';
  browserInfo: BrowserInfo;
  timestamp: number;
  sessionId: string;
  additionalData?: Record<string, any>;
}

export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  reportingEndpoint?: string;
  batchSize: number;
  flushInterval: number; // milliseconds
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableUsageTracking: boolean;
  enableFeatureTracking: boolean;
  maxStorageSize: number; // maximum number of metrics to store locally
}

export interface MonitoringReport {
  browserDistribution: Record<string, number>;
  featureSupport: Record<string, { supported: number; total: number; polyfillUsage: number }>;
  errorSummary: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    fallbackSuccess: number;
  };
  performanceImpact: {
    polyfillOverhead: number;
    detectionTime: number;
    fallbackRenderTime: number;
  };
  timeRange: {
    start: number;
    end: number;
  };
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // Monitor 10% of sessions
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableUsageTracking: true,
  enableFeatureTracking: true,
  maxStorageSize: 1000
};

/**
 * Compatibility Monitoring Service
 */
export class CompatibilityMonitoringService {
  private config: MonitoringConfig;
  private sessionId: string;
  private isMonitoring: boolean = false;
  private metricsBuffer: {
    browserUsage: BrowserUsageMetrics[];
    featureSupport: FeatureSupportMetrics[];
    errors: CompatibilityErrorMetrics[];
    performance: PerformanceMetrics[];
  } = {
    browserUsage: [],
    featureSupport: [],
    errors: [],
    performance: []
  };
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (this.shouldMonitor()) {
      this.initialize();
    }
  }

  /**
   * Initialize monitoring system
   */
  private initialize(): void {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Track initial browser usage
    if (this.config.enableUsageTracking) {
      this.trackBrowserUsage();
    }

    // Set up periodic flushing
    this.setupPeriodicFlush();

    // Set up performance monitoring
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceMonitoring();
    }

    // Set up error event listeners
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Track page visibility changes
    this.setupVisibilityTracking();
  }

  /**
   * Track browser usage metrics
   */
  trackBrowserUsage(): void {
    if (!this.config.enableUsageTracking || typeof window === 'undefined') return;

    const browserInfo = browserDetectionService.getBrowserInfo();
    
    const metrics: BrowserUsageMetrics = {
      browserName: browserInfo.name,
      browserVersion: browserInfo.version,
      isSupported: browserInfo.isSupported,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.detectDeviceType(),
      platform: navigator.platform
    };

    this.addMetric('browserUsage', metrics);
  }

  /**
   * Track feature support and polyfill usage
   */
  trackFeatureSupport(feature: string, polyfillName?: string, loadTime?: number): void {
    if (!this.config.enableFeatureTracking) return;

    const browserInfo = browserDetectionService.getBrowserInfo();
    const isSupported = browserDetectionService.supportsFeature(feature);
    
    const metrics: FeatureSupportMetrics = {
      feature,
      isSupported,
      polyfillLoaded: !!polyfillName,
      polyfillName,
      loadTime,
      browserInfo,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.addMetric('featureSupport', metrics);
  }

  /**
   * Track compatibility errors
   */
  trackCompatibilityError(error: CompatibilityError): void {
    if (!this.config.enableErrorTracking) return;

    const metrics: CompatibilityErrorMetrics = {
      errorId: this.generateErrorId(error),
      type: error.type,
      feature: error.feature,
      severity: error.severity,
      message: error.message,
      fallbackApplied: error.fallbackApplied,
      browserInfo: error.browser,
      timestamp: error.timestamp,
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      stackTrace: error.originalError?.stack,
      userImpact: this.assessUserImpact(error)
    };

    this.addMetric('errors', metrics);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    metric: string,
    value: number,
    unit: PerformanceMetrics['unit'],
    category: PerformanceMetrics['category'],
    additionalData?: Record<string, any>
  ): void {
    if (!this.config.enablePerformanceTracking) return;

    const browserInfo = browserDetectionService.getBrowserInfo();
    
    const metrics: PerformanceMetrics = {
      metric,
      value,
      unit,
      category,
      browserInfo,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      additionalData
    };

    this.addMetric('performance', metrics);
  }

  /**
   * Track polyfill loading performance
   */
  trackPolyfillPerformance(polyfillName: string, loadTime: number, size?: number): void {
    this.trackPerformance(`polyfill_load_time_${polyfillName}`, loadTime, 'ms', 'polyfill', {
      polyfillName,
      size
    });

    if (size) {
      this.trackPerformance(`polyfill_size_${polyfillName}`, size, 'bytes', 'polyfill', {
        polyfillName
      });
    }
  }

  /**
   * Track feature detection performance
   */
  trackDetectionPerformance(feature: string, detectionTime: number): void {
    this.trackPerformance(`detection_time_${feature}`, detectionTime, 'ms', 'detection', {
      feature
    });
  }

  /**
   * Track fallback rendering performance
   */
  trackFallbackPerformance(fallback: string, renderTime: number): void {
    this.trackPerformance(`fallback_render_time_${fallback}`, renderTime, 'ms', 'fallback', {
      fallback
    });
  }

  /**
   * Generate monitoring report
   */
  generateReport(): MonitoringReport {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentMetrics = this.getRecentMetrics(oneHour);

    return {
      browserDistribution: this.calculateBrowserDistribution(recentMetrics.browserUsage),
      featureSupport: this.calculateFeatureSupport(recentMetrics.featureSupport),
      errorSummary: this.calculateErrorSummary(recentMetrics.errors),
      performanceImpact: this.calculatePerformanceImpact(recentMetrics.performance),
      timeRange: {
        start: now - oneHour,
        end: now
      }
    };
  }

  /**
   * Get browser usage statistics
   */
  getBrowserStats(): Record<string, any> {
    const browserMetrics = this.metricsBuffer.browserUsage;
    
    return {
      totalSessions: browserMetrics.length,
      uniqueBrowsers: new Set(browserMetrics.map(m => `${m.browserName}_${m.browserVersion}`)).size,
      supportedBrowsers: browserMetrics.filter(m => m.isSupported).length,
      deviceTypes: this.groupBy(browserMetrics, 'deviceType'),
      platforms: this.groupBy(browserMetrics, 'platform')
    };
  }

  /**
   * Get feature usage statistics
   */
  getFeatureStats(): Record<string, any> {
    const featureMetrics = this.metricsBuffer.featureSupport;
    
    const stats: Record<string, any> = {};
    
    featureMetrics.forEach(metric => {
      if (!stats[metric.feature]) {
        stats[metric.feature] = {
          total: 0,
          supported: 0,
          polyfillUsed: 0,
          avgLoadTime: 0,
          loadTimes: []
        };
      }
      
      stats[metric.feature].total++;
      if (metric.isSupported) stats[metric.feature].supported++;
      if (metric.polyfillLoaded) stats[metric.feature].polyfillUsed++;
      if (metric.loadTime) stats[metric.feature].loadTimes.push(metric.loadTime);
    });

    // Calculate average load times
    Object.keys(stats).forEach(feature => {
      const loadTimes = stats[feature].loadTimes;
      if (loadTimes.length > 0) {
        stats[feature].avgLoadTime = loadTimes.reduce((a: number, b: number) => a + b, 0) / loadTimes.length;
      }
      delete stats[feature].loadTimes; // Remove raw data
    });

    return stats;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, any> {
    const errorMetrics = this.metricsBuffer.errors;
    
    return {
      total: errorMetrics.length,
      bySeverity: this.groupBy(errorMetrics, 'severity'),
      byType: this.groupBy(errorMetrics, 'type'),
      byFeature: this.groupBy(errorMetrics, 'feature'),
      withFallbacks: errorMetrics.filter(e => e.fallbackApplied).length,
      userImpact: this.groupBy(errorMetrics, 'userImpact')
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, any> {
    const perfMetrics = this.metricsBuffer.performance;
    
    const stats: Record<string, any> = {};
    
    perfMetrics.forEach(metric => {
      const key = `${metric.category}_${metric.metric}`;
      if (!stats[key]) {
        stats[key] = {
          values: [],
          unit: metric.unit,
          category: metric.category
        };
      }
      stats[key].values.push(metric.value);
    });

    // Calculate statistics for each metric
    Object.keys(stats).forEach(key => {
      const values = stats[key].values;
      stats[key] = {
        ...stats[key],
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        median: this.calculateMedian(values)
      };
      delete stats[key].values; // Remove raw data
    });

    return stats;
  }

  /**
   * Flush metrics to reporting endpoint
   */
  async flush(): Promise<void> {
    if (!this.hasMetricsToFlush()) return;

    const payload = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: { ...this.metricsBuffer }
    };

    try {
      if (this.config.reportingEndpoint) {
        await this.sendToEndpoint(payload);
      } else {
        // Store locally for development/testing
        this.storeLocally(payload);
      }

      // Clear buffer after successful flush
      this.clearBuffer();
    } catch (error) {
      console.warn('Failed to flush compatibility metrics:', error);
    }
  }

  /**
   * Stop monitoring and flush remaining metrics
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Final flush
    await this.flush();
  }

  private shouldMonitor(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(error: CompatibilityError): string {
    return `${error.type}-${error.feature}-${error.timestamp}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private assessUserImpact(error: CompatibilityError): CompatibilityErrorMetrics['userImpact'] {
    if (error.fallbackApplied) {
      return error.severity === 'critical' ? 'moderate' : 'minor';
    }

    switch (error.severity) {
      case 'critical': return 'severe';
      case 'high': return 'moderate';
      case 'medium': return 'minor';
      case 'low': return 'none';
      default: return 'minor';
    }
  }

  private addMetric(
    type: 'browserUsage',
    metric: BrowserUsageMetrics
  ): void;
  private addMetric(
    type: 'featureSupport',
    metric: FeatureSupportMetrics
  ): void;
  private addMetric(
    type: 'errors',
    metric: CompatibilityErrorMetrics
  ): void;
  private addMetric(
    type: 'performance',
    metric: PerformanceMetrics
  ): void;
  private addMetric(
    type: keyof typeof this.metricsBuffer,
    metric: BrowserUsageMetrics | FeatureSupportMetrics | CompatibilityErrorMetrics | PerformanceMetrics
  ): void {
    (this.metricsBuffer[type] as any[]).push(metric);
    
    // Prevent memory issues by limiting buffer size
    if (this.metricsBuffer[type].length > this.config.maxStorageSize) {
      this.metricsBuffer[type] = this.metricsBuffer[type].slice(-this.config.maxStorageSize) as any;
    }

    // Trigger flush if buffer is full
    if (this.getTotalMetricsCount() >= this.config.batchSize) {
      this.flush();
    }
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('polyfill') || entry.name.includes('compatibility')) {
            this.trackPerformance(
              entry.name,
              entry.duration,
              'ms',
              'polyfill',
              {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            );
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('Failed to set up performance monitoring:', error);
    }
  }

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('compatibility-error', (event: any) => {
      const { errors } = event.detail;
      errors.forEach((error: CompatibilityError) => {
        this.trackCompatibilityError(error);
      });
    });
  }

  private setupVisibilityTracking(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush metrics when page becomes hidden
        this.flush();
      }
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private hasMetricsToFlush(): boolean {
    return this.getTotalMetricsCount() > 0;
  }

  private getTotalMetricsCount(): number {
    return Object.values(this.metricsBuffer).reduce((total, buffer) => total + buffer.length, 0);
  }

  private async sendToEndpoint(payload: any): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    const response = await fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.status}`);
    }
  }

  private storeLocally(payload: any): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const key = `compatibility-metrics-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(payload));
      
      // Clean up old entries (keep only last 10)
      const keys = Object.keys(localStorage)
        .filter(k => k.startsWith('compatibility-metrics-'))
        .sort()
        .reverse();
      
      if (keys.length > 10) {
        keys.slice(10).forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.warn('Failed to store metrics locally:', error);
    }
  }

  private clearBuffer(): void {
    this.metricsBuffer = {
      browserUsage: [],
      featureSupport: [],
      errors: [],
      performance: []
    };
  }

  private getRecentMetrics(timeWindow: number) {
    const cutoff = Date.now() - timeWindow;
    
    return {
      browserUsage: this.metricsBuffer.browserUsage.filter(m => m.timestamp > cutoff),
      featureSupport: this.metricsBuffer.featureSupport.filter(m => m.timestamp > cutoff),
      errors: this.metricsBuffer.errors.filter(m => m.timestamp > cutoff),
      performance: this.metricsBuffer.performance.filter(m => m.timestamp > cutoff)
    };
  }

  private calculateBrowserDistribution(metrics: BrowserUsageMetrics[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    metrics.forEach(metric => {
      const key = `${metric.browserName} ${metric.browserVersion}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  private calculateFeatureSupport(metrics: FeatureSupportMetrics[]): Record<string, { supported: number; total: number; polyfillUsage: number }> {
    const support: Record<string, { supported: number; total: number; polyfillUsage: number }> = {};
    
    metrics.forEach(metric => {
      if (!support[metric.feature]) {
        support[metric.feature] = { supported: 0, total: 0, polyfillUsage: 0 };
      }
      
      support[metric.feature].total++;
      if (metric.isSupported) support[metric.feature].supported++;
      if (metric.polyfillLoaded) support[metric.feature].polyfillUsage++;
    });

    return support;
  }

  private calculateErrorSummary(metrics: CompatibilityErrorMetrics[]) {
    return {
      total: metrics.length,
      bySeverity: this.groupBy(metrics, 'severity'),
      byType: this.groupBy(metrics, 'type'),
      fallbackSuccess: metrics.filter(m => m.fallbackApplied).length
    };
  }

  private calculatePerformanceImpact(metrics: PerformanceMetrics[]) {
    const polyfillMetrics = metrics.filter(m => m.category === 'polyfill');
    const detectionMetrics = metrics.filter(m => m.category === 'detection');
    const fallbackMetrics = metrics.filter(m => m.category === 'fallback');

    return {
      polyfillOverhead: this.calculateAverage(polyfillMetrics.map(m => m.value)),
      detectionTime: this.calculateAverage(detectionMetrics.map(m => m.value)),
      fallbackRenderTime: this.calculateAverage(fallbackMetrics.map(m => m.value))
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    array.forEach(item => {
      const value = String(item[key]);
      grouped[value] = (grouped[value] || 0) + 1;
    });

    return grouped;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

// Export singleton instance
export const compatibilityMonitoring = new CompatibilityMonitoringService();

/**
 * Utility functions for monitoring integration
 */
export const monitoringUtils = {
  /**
   * Track polyfill loading with performance metrics
   */
  trackPolyfillLoad: async (polyfillName: string, loadFn: () => Promise<void>): Promise<void> => {
    const startTime = performance.now();
    
    try {
      await loadFn();
      const loadTime = performance.now() - startTime;
      
      compatibilityMonitoring.trackFeatureSupport(polyfillName, polyfillName, loadTime);
      compatibilityMonitoring.trackPolyfillPerformance(polyfillName, loadTime);
    } catch (error) {
      const loadTime = performance.now() - startTime;
      compatibilityMonitoring.trackPolyfillPerformance(polyfillName, loadTime);
      throw error;
    }
  },

  /**
   * Track feature detection with timing
   */
  trackFeatureDetection: <T>(feature: string, detectionFn: () => T): T => {
    const startTime = performance.now();
    
    try {
      const result = detectionFn();
      const detectionTime = performance.now() - startTime;
      
      compatibilityMonitoring.trackDetectionPerformance(feature, detectionTime);
      compatibilityMonitoring.trackFeatureSupport(feature);
      
      return result;
    } catch (error) {
      const detectionTime = performance.now() - startTime;
      compatibilityMonitoring.trackDetectionPerformance(feature, detectionTime);
      throw error;
    }
  },

  /**
   * Track fallback rendering performance
   */
  trackFallbackRender: async (fallbackName: string, renderFn: () => Promise<void>): Promise<void> => {
    const startTime = performance.now();
    
    try {
      await renderFn();
      const renderTime = performance.now() - startTime;
      compatibilityMonitoring.trackFallbackPerformance(fallbackName, renderTime);
    } catch (error) {
      const renderTime = performance.now() - startTime;
      compatibilityMonitoring.trackFallbackPerformance(fallbackName, renderTime);
      throw error;
    }
  }
};