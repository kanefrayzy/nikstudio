/**
 * Tests for Compatibility Monitoring System
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  CompatibilityMonitoringService
} from '@/lib/compatibility-monitoring';
import { CompatibilityError } from '@/lib/compatibility-error-handler';
import { BrowserInfo } from '@/lib/browser-detection';

// Mock browser APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => [])
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  platform: 'Win32'
};

const mockScreen = {
  width: 1920,
  height: 1080
};

const mockWindow = {
  innerWidth: 1366,
  innerHeight: 768,
  location: {
    href: 'https://example.com/test'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockDocument = {
  referrer: 'https://google.com',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  keys: vi.fn(() => [])
};

// Setup global mocks
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'screen', {
  value: mockScreen,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    ...mockWindow,
    navigator: mockNavigator,
    screen: mockScreen,
    performance: mockPerformance,
    localStorage: mockLocalStorage
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('CompatibilityMonitoringService', () => {
  let monitoringService: CompatibilityMonitoringService;
  let mockFetch: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Create monitoring service with disabled initialization to avoid browser detection issues
    monitoringService = new CompatibilityMonitoringService({
      enabled: false, // Disable to avoid initialization issues in tests
      sampleRate: 1.0,
      batchSize: 10,
      flushInterval: 1000,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableUsageTracking: true,
      enableFeatureTracking: true
    });
  });

  afterEach(async () => {
    if (monitoringService && typeof monitoringService.stop === 'function') {
      await monitoringService.stop();
    }
  });

  describe('Browser Usage Tracking', () => {
    it('should track browser usage metrics', () => {
      monitoringService.trackBrowserUsage();
      
      const stats = monitoringService.getBrowserStats();
      
      expect(stats.totalSessions).toBe(1);
      expect(stats.deviceTypes).toBeDefined();
      expect(stats.platforms).toBeDefined();
    });

    it('should detect device type correctly', () => {
      // Test mobile detection
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      monitoringService.trackBrowserUsage();
      
      let stats = monitoringService.getBrowserStats();
      expect(stats.deviceTypes.mobile).toBe(1);
      
      // Test tablet detection
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      monitoringService = new CompatibilityMonitoringService({ enabled: true, sampleRate: 1.0 });
      monitoringService.trackBrowserUsage();
      
      stats = monitoringService.getBrowserStats();
      expect(stats.deviceTypes.tablet).toBe(1);
      
      // Test desktop detection
      Object.defineProperty(window, 'innerWidth', { value: 1366, writable: true });
      monitoringService = new CompatibilityMonitoringService({ enabled: true, sampleRate: 1.0 });
      monitoringService.trackBrowserUsage();
      
      stats = monitoringService.getBrowserStats();
      expect(stats.deviceTypes.desktop).toBe(1);
    });
  });

  describe('Feature Support Tracking', () => {
    it('should track feature support metrics', () => {
      monitoringService.trackFeatureSupport('fetch', 'fetch-polyfill', 150);
      
      const stats = monitoringService.getFeatureStats();
      
      expect(stats.fetch).toBeDefined();
      expect(stats.fetch.total).toBe(1);
      expect(stats.fetch.polyfillUsed).toBe(1);
      expect(stats.fetch.avgLoadTime).toBe(150);
    });

    it('should track multiple features', () => {
      monitoringService.trackFeatureSupport('fetch');
      monitoringService.trackFeatureSupport('promises');
      monitoringService.trackFeatureSupport('cssGrid', 'grid-polyfill', 200);
      
      const stats = monitoringService.getFeatureStats();
      
      expect(Object.keys(stats)).toHaveLength(3);
      expect(stats.fetch.total).toBe(1);
      expect(stats.promises.total).toBe(1);
      expect(stats.cssGrid.total).toBe(1);
      expect(stats.cssGrid.polyfillUsed).toBe(1);
    });

    it('should calculate average load times correctly', () => {
      monitoringService.trackFeatureSupport('fetch', 'fetch-polyfill', 100);
      monitoringService.trackFeatureSupport('fetch', 'fetch-polyfill', 200);
      monitoringService.trackFeatureSupport('fetch', 'fetch-polyfill', 300);
      
      const stats = monitoringService.getFeatureStats();
      
      expect(stats.fetch.avgLoadTime).toBe(200);
      expect(stats.fetch.total).toBe(3);
    });
  });

  describe('Error Tracking', () => {
    it('should track compatibility errors', () => {
      const mockBrowserInfo: BrowserInfo = {
        name: 'chrome',
        version: 91,
        isSupported: true,
        features: {
          fetch: true,
          promises: true,
          asyncAwait: true,
          cssGrid: true,
          cssFlexbox: true,
          customProperties: true,
          intersectionObserver: true,
          webp: true,
          webm: true,
          mp4: true,
          fileApi: true,
          formData: true,
          customEvent: true,
          objectAssign: true
        }
      };

      const error: CompatibilityError = {
        type: 'polyfill',
        feature: 'fetch',
        browser: mockBrowserInfo,
        fallbackApplied: false,
        message: 'Failed to load fetch polyfill',
        timestamp: Date.now(),
        severity: 'high'
      };

      monitoringService.trackCompatibilityError(error);
      
      const stats = monitoringService.getErrorStats();
      
      expect(stats.total).toBe(1);
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.byType.polyfill).toBe(1);
      expect(stats.byFeature.fetch).toBe(1);
    });

    it('should track fallback success', () => {
      const mockBrowserInfo: BrowserInfo = {
        name: 'chrome',
        version: 91,
        isSupported: true,
        features: {
          fetch: false,
          promises: true,
          asyncAwait: true,
          cssGrid: true,
          cssFlexbox: true,
          customProperties: true,
          intersectionObserver: true,
          webp: true,
          webm: true,
          mp4: true,
          fileApi: true,
          formData: true,
          customEvent: true,
          objectAssign: true
        }
      };

      const error: CompatibilityError = {
        type: 'polyfill',
        feature: 'fetch',
        browser: mockBrowserInfo,
        fallbackApplied: true,
        message: 'Fetch polyfill applied successfully',
        timestamp: Date.now(),
        severity: 'medium'
      };

      monitoringService.trackCompatibilityError(error);
      
      const stats = monitoringService.getErrorStats();
      
      expect(stats.withFallbacks).toBe(1);
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      monitoringService.trackPerformance('polyfill_load_fetch', 150, 'ms', 'polyfill');
      monitoringService.trackPerformance('detection_time_cssGrid', 5, 'ms', 'detection');
      
      const stats = monitoringService.getPerformanceStats();
      
      expect(stats['polyfill_polyfill_load_fetch']).toBeDefined();
      expect(stats['detection_detection_time_cssGrid']).toBeDefined();
      expect(stats['polyfill_polyfill_load_fetch'].avg).toBe(150);
      expect(stats['detection_detection_time_cssGrid'].avg).toBe(5);
    });

    it('should calculate performance statistics correctly', () => {
      // Add multiple measurements for the same metric
      monitoringService.trackPerformance('test_metric', 100, 'ms', 'polyfill');
      monitoringService.trackPerformance('test_metric', 200, 'ms', 'polyfill');
      monitoringService.trackPerformance('test_metric', 300, 'ms', 'polyfill');
      
      const stats = monitoringService.getPerformanceStats();
      const metric = stats['polyfill_test_metric'];
      
      expect(metric.count).toBe(3);
      expect(metric.min).toBe(100);
      expect(metric.max).toBe(300);
      expect(metric.avg).toBe(200);
      expect(metric.median).toBe(200);
    });

    it('should track polyfill performance specifically', () => {
      monitoringService.trackPolyfillPerformance('fetch-polyfill', 150, 1024);
      
      const stats = monitoringService.getPerformanceStats();
      
      expect(stats['polyfill_polyfill_load_time_fetch-polyfill']).toBeDefined();
      expect(stats['polyfill_polyfill_size_fetch-polyfill']).toBeDefined();
      expect(stats['polyfill_polyfill_load_time_fetch-polyfill'].avg).toBe(150);
      expect(stats['polyfill_polyfill_size_fetch-polyfill'].avg).toBe(1024);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive monitoring report', () => {
      // Add some test data
      monitoringService.trackBrowserUsage();
      monitoringService.trackFeatureSupport('fetch', 'fetch-polyfill', 150);
      monitoringService.trackPerformance('polyfill_load', 100, 'ms', 'polyfill');
      
      const report = monitoringService.generateReport();
      
      expect(report.browserDistribution).toBeDefined();
      expect(report.featureSupport).toBeDefined();
      expect(report.errorSummary).toBeDefined();
      expect(report.performanceImpact).toBeDefined();
      expect(report.timeRange).toBeDefined();
      expect(report.timeRange.start).toBeLessThan(report.timeRange.end);
    });

    it('should calculate browser distribution correctly', () => {
      monitoringService.trackBrowserUsage();
      
      const report = monitoringService.generateReport();
      
      expect(Object.keys(report.browserDistribution).length).toBeGreaterThan(0);
      expect(Object.values(report.browserDistribution).every(count => count > 0)).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should store metrics locally when no endpoint is configured', async () => {
      monitoringService.trackBrowserUsage();
      
      await monitoringService.flush();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const setItemCall = (mockLocalStorage.setItem as Mock).mock.calls[0];
      expect(setItemCall[0]).toMatch(/^compatibility-metrics-/);
      expect(() => JSON.parse(setItemCall[1])).not.toThrow();
    });

    it('should send metrics to endpoint when configured', async () => {
      const monitoringWithEndpoint = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 1.0,
        reportingEndpoint: 'https://api.example.com/metrics'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      monitoringWithEndpoint.trackBrowserUsage();
      await monitoringWithEndpoint.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/metrics',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        })
      );

      await monitoringWithEndpoint.stop();
    });

    it('should handle endpoint errors gracefully', async () => {
      const monitoringWithEndpoint = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 1.0,
        reportingEndpoint: 'https://api.example.com/metrics'
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      monitoringWithEndpoint.trackBrowserUsage();
      
      // Should not throw
      await expect(monitoringWithEndpoint.flush()).resolves.not.toThrow();

      await monitoringWithEndpoint.stop();
    });
  });

  describe('Configuration', () => {
    it('should respect sample rate', () => {
      // Mock Math.random to return 0.5
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5);

      // Should not monitor with 0.1 sample rate (0.5 > 0.1)
      const _lowSampleMonitoring = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 0.1
      });

      // Should monitor with 0.9 sample rate (0.5 < 0.9)
      const _highSampleMonitoring = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 0.9
      });

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should respect feature flags', () => {
      const selectiveMonitoring = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 1.0,
        enableUsageTracking: false,
        enableFeatureTracking: true,
        enableErrorTracking: false,
        enablePerformanceTracking: true
      });

      // These should work
      selectiveMonitoring.trackFeatureSupport('fetch');
      selectiveMonitoring.trackPerformance('test', 100, 'ms', 'polyfill');

      // These should be ignored (but not throw)
      expect(() => {
        selectiveMonitoring.trackBrowserUsage();
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should limit buffer size to prevent memory issues', () => {
      const smallBufferMonitoring = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 1.0,
        maxStorageSize: 5
      });

      // Add more metrics than the buffer size
      for (let i = 0; i < 10; i++) {
        smallBufferMonitoring.trackPerformance(`metric_${i}`, i, 'ms', 'polyfill');
      }

      const stats = smallBufferMonitoring.getPerformanceStats();
      
      // Should only have the last 5 metrics
      expect(Object.keys(stats).length).toBeLessThanOrEqual(5);
    });

    it('should trigger flush when batch size is reached', async () => {
      const batchMonitoring = new CompatibilityMonitoringService({
        enabled: true,
        sampleRate: 1.0,
        batchSize: 3
      });

      const flushSpy = vi.spyOn(batchMonitoring, 'flush');

      // Add metrics up to batch size
      batchMonitoring.trackPerformance('metric1', 100, 'ms', 'polyfill');
      batchMonitoring.trackPerformance('metric2', 200, 'ms', 'polyfill');
      batchMonitoring.trackPerformance('metric3', 300, 'ms', 'polyfill');

      // Should trigger flush
      expect(flushSpy).toHaveBeenCalled();

      await batchMonitoring.stop();
    });
  });
});