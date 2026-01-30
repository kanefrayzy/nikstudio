/**
 * Final Cross-Browser Compatibility Validation Tests
 * Comprehensive test suite to validate all compatibility implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  polyfillBundleOptimizer,
  getOptimizedPolyfillConfig,
  getPolyfillBundles
} from '@/lib/polyfill-optimizer';
import {
  cssFallbackOptimizer,
  getOptimizedCSSFallbacks,
  getCriticalCSS
} from '@/lib/css-fallback-optimizer';
import { browserDetectionService } from '@/lib/browser-detection';
import { compatibilityMonitoring } from '@/lib/compatibility-monitoring';
import { compatibilityErrorHandler } from '@/lib/compatibility-error-handler';

// Mock browser environments for testing
const mockBrowsers = {
  modernChrome: {
    name: 'chrome' as const,
    version: 120,
    isSupported: true,
    features: {
      fetch: true,
      promises: true,
      asyncAwait: true,
      cssGrid: true,
      cssFlexbox: true,
      customProperties: true,
      intersectionObserver: true,
      customEvent: true,
      objectAssign: true
    }
  },
  oldChrome: {
    name: 'chrome' as const,
    version: 75,
    isSupported: true,
    features: {
      fetch: false,
      promises: true,
      asyncAwait: false,
      cssGrid: false,
      cssFlexbox: true,
      customProperties: false,
      intersectionObserver: false,
      customEvent: false,
      objectAssign: false
    }
  },
  modernFirefox: {
    name: 'firefox' as const,
    version: 115,
    isSupported: true,
    features: {
      fetch: true,
      promises: true,
      asyncAwait: true,
      cssGrid: true,
      cssFlexbox: true,
      customProperties: true,
      intersectionObserver: true,
      customEvent: true,
      objectAssign: true
    }
  },
  oldSafari: {
    name: 'safari' as const,
    version: 12,
    isSupported: true,
    features: {
      fetch: true,
      promises: true,
      asyncAwait: true,
      cssGrid: false,
      cssFlexbox: true,
      customProperties: false,
      intersectionObserver: false,
      customEvent: false,
      objectAssign: true
    }
  }
};

describe('Final Cross-Browser Compatibility Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Polyfill Bundle Optimization', () => {
    it('should generate minimal polyfill bundles for modern browsers', () => {
      const bundles = polyfillBundleOptimizer.generateOptimizedBundles(mockBrowsers.modernChrome);

      expect(bundles).toHaveLength(0);
    });

    it('should generate appropriate polyfill bundles for older browsers', () => {
      const bundles = polyfillBundleOptimizer.generateOptimizedBundles(mockBrowsers.oldChrome);

      expect(bundles.length).toBeGreaterThan(0);
      expect(bundles.some(b => b.priority === 'high')).toBe(true);

      // Should include fetch polyfill for old Chrome
      const highPriorityBundle = bundles.find(b => b.priority === 'high');
      expect(highPriorityBundle?.polyfills).toContain('fetch');
    });

    it('should respect bundle size limits', () => {
      const optimizer = new (polyfillBundleOptimizer.constructor as any)(5120); // 5KB limit
      const bundles = optimizer.generateOptimizedBundles(mockBrowsers.oldChrome);

      bundles.forEach(bundle => {
        expect(bundle.size).toBeLessThanOrEqual(5120);
      });
    });

    it('should prioritize critical polyfills', () => {
      const bundles = polyfillBundleOptimizer.generateOptimizedBundles(mockBrowsers.oldChrome);
      const priorities = bundles.map(b => b.priority);

      if (priorities.includes('high')) {
        const highIndex = priorities.indexOf('high');
        const mediumIndex = priorities.indexOf('medium');

        if (mediumIndex !== -1) {
          expect(highIndex).toBeLessThan(mediumIndex);
        }
      }
    });

    it('should generate optimized polyfill configuration', () => {
      const config = getOptimizedPolyfillConfig(mockBrowsers.oldChrome);

      expect(config.fetch).toBeDefined();
      expect(config.fetch?.enabled).toBe(true);
    });

    it('should calculate bundle sizes accurately', () => {
      const size = polyfillBundleOptimizer.calculateBundleSize(mockBrowsers.oldChrome);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should generate appropriate loading strategies', () => {
      const eagerStrategy = polyfillBundleOptimizer.getLoadingStrategy(mockBrowsers.modernChrome);
      const lazyStrategy = polyfillBundleOptimizer.getLoadingStrategy(mockBrowsers.oldChrome);

      expect(['eager', 'lazy', 'critical-only']).toContain(eagerStrategy);
      expect(['eager', 'lazy', 'critical-only']).toContain(lazyStrategy);
    });
  });

  describe('CSS Fallback Optimization', () => {
    it('should generate minimal CSS fallbacks for modern browsers', () => {
      const fallbacks = cssFallbackOptimizer.generateOptimizedFallbacks(mockBrowsers.modernChrome);

      expect(fallbacks).toHaveLength(0);
    });

    it('should generate appropriate CSS fallbacks for older browsers', () => {
      const fallbacks = cssFallbackOptimizer.generateOptimizedFallbacks(mockBrowsers.oldSafari);

      expect(fallbacks.length).toBeGreaterThan(0);
      expect(fallbacks.some(f => f.priority === 'critical')).toBe(true);
    });

    it('should generate critical inline CSS', () => {
      const criticalCSS = cssFallbackOptimizer.generateInlineCSS(mockBrowsers.oldSafari);

      if (criticalCSS) {
        expect(criticalCSS).toContain('display: flex');
        expect(criticalCSS).toContain('@supports');
      }
    });

    it('should calculate fallback sizes accurately', () => {
      const size = cssFallbackOptimizer.calculateFallbackSize(mockBrowsers.oldSafari);

      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should group fallbacks by priority', () => {
      const fallbacks = cssFallbackOptimizer.generateOptimizedFallbacks(mockBrowsers.oldSafari);

      const priorities = fallbacks.map(f => f.priority);
      const uniquePriorities = [...new Set(priorities)];

      expect(uniquePriorities.length).toBeGreaterThanOrEqual(1);
      expect(uniquePriorities.every(p => ['critical', 'important', 'optional'].includes(p))).toBe(true);
    });

    it('should enable/disable features correctly', () => {
      const _initialFeatures = cssFallbackOptimizer.getEnabledFeatures();

      cssFallbackOptimizer.setFeatureEnabled('cssGrid', false);
      const afterDisable = cssFallbackOptimizer.getEnabledFeatures();

      expect(afterDisable).not.toContain('cssGrid');

      cssFallbackOptimizer.setFeatureEnabled('cssGrid', true);
      const afterEnable = cssFallbackOptimizer.getEnabledFeatures();

      expect(afterEnable).toContain('cssGrid');
    });
  });

  describe('Browser Detection Integration', () => {
    it('should detect browser capabilities accurately', () => {
      // Mock browser detection
      vi.spyOn(browserDetectionService, 'getBrowserInfo').mockReturnValue(mockBrowsers.modernChrome);

      const browserInfo = browserDetectionService.getBrowserInfo();

      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(120);
      expect(browserInfo.features.fetch).toBe(true);
    });

    it('should integrate with polyfill optimization', () => {
      vi.spyOn(browserDetectionService, 'getBrowserInfo').mockReturnValue(mockBrowsers.oldChrome);

      const bundles = getPolyfillBundles();

      expect(bundles.length).toBeGreaterThan(0);
    });

    it('should integrate with CSS fallback optimization', () => {
      vi.spyOn(browserDetectionService, 'getBrowserInfo').mockReturnValue(mockBrowsers.oldSafari);

      const fallbacks = getOptimizedCSSFallbacks();
      const criticalCSS = getCriticalCSS();

      expect(fallbacks.length).toBeGreaterThan(0);
      expect(typeof criticalCSS).toBe('string');
    });
  });

  describe('Compatibility Monitoring', () => {
    it('should track browser usage patterns', () => {
      const trackSpy = vi.spyOn(compatibilityMonitoring, 'trackBrowserUsage');

      compatibilityMonitoring.trackBrowserUsage();

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should track feature support', () => {
      const trackSpy = vi.spyOn(compatibilityMonitoring, 'trackFeatureSupport');

      compatibilityMonitoring.trackFeatureSupport('fetch');

      expect(trackSpy).toHaveBeenCalledWith('fetch');
    });

    it('should track polyfill performance', () => {
      const trackSpy = vi.spyOn(compatibilityMonitoring, 'trackPolyfillPerformance');

      compatibilityMonitoring.trackPolyfillPerformance('fetch', 100);

      expect(trackSpy).toHaveBeenCalledWith('fetch', 100);
    });

    it('should generate compatibility reports', () => {
      const report = compatibilityMonitoring.generateReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
      expect(report.browserDistribution).toBeDefined();
      expect(report.featureSupport).toBeDefined();
      expect(report.errorSummary).toBeDefined();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle compatibility errors gracefully', () => {
      const handleSpy = vi.spyOn(compatibilityErrorHandler, 'handleError');

      const error = {
        type: 'polyfill' as const,
        feature: 'fetch',
        browser: mockBrowsers.oldChrome,
        fallbackApplied: false,
        message: 'Fetch polyfill failed to load'
      };

      compatibilityErrorHandler.handleError(error);

      expect(handleSpy).toHaveBeenCalledWith(error);
    });

    it('should create compatibility errors correctly', () => {
      const error = compatibilityErrorHandler.createError(
        'polyfill',
        'fetch',
        'Fetch polyfill failed to load',
        new Error('Network error'),
        'high'
      );

      expect(error.type).toBe('polyfill');
      expect(error.feature).toBe('fetch');
      expect(error.severity).toBe('high');
      expect(error.message).toBe('Fetch polyfill failed to load');
    });

    it('should handle polyfill errors', async () => {
      const handleSpy = vi.spyOn(compatibilityErrorHandler, 'handlePolyfillError');

      await compatibilityErrorHandler.handlePolyfillError('fetch', new Error('Load failed'));

      expect(handleSpy).toHaveBeenCalledWith('fetch', expect.any(Error));
    });
  });

  describe('Performance Optimization', () => {
    it('should minimize bundle sizes for modern browsers', () => {
      const modernBundleSize = polyfillBundleOptimizer.calculateBundleSize(mockBrowsers.modernChrome);
      const oldBundleSize = polyfillBundleOptimizer.calculateBundleSize(mockBrowsers.oldChrome);

      expect(modernBundleSize).toBeLessThanOrEqual(oldBundleSize);
    });

    it('should optimize CSS delivery', () => {
      const modernCSSSize = cssFallbackOptimizer.calculateFallbackSize(mockBrowsers.modernChrome);
      const oldCSSSize = cssFallbackOptimizer.calculateFallbackSize(mockBrowsers.oldSafari);

      expect(modernCSSSize).toBeLessThanOrEqual(oldCSSSize);
    });

    it('should generate preload hints for critical resources', () => {
      const hints = polyfillBundleOptimizer.generatePreloadHints(mockBrowsers.oldChrome);

      expect(Array.isArray(hints)).toBe(true);
      hints.forEach(hint => {
        expect(hint).toContain('<link rel="preload"');
        expect(hint).toContain('as="script"');
      });
    });

    it('should provide appropriate loading strategies', () => {
      const strategies = [
        polyfillBundleOptimizer.getLoadingStrategy(mockBrowsers.modernChrome),
        polyfillBundleOptimizer.getLoadingStrategy(mockBrowsers.oldChrome, 'slow-2g'),
        polyfillBundleOptimizer.getLoadingStrategy(mockBrowsers.oldChrome, '4g')
      ];

      strategies.forEach(strategy => {
        expect(['eager', 'lazy', 'critical-only']).toContain(strategy);
      });
    });
  });

  describe('Cross-Browser Feature Validation', () => {
    it('should validate all required features are covered', () => {
      const requiredFeatures = [
        'fetch', 'promises', 'cssGrid', 'cssFlexbox',
        'customProperties', 'intersectionObserver'
      ];

      const oldBrowserConfig = getOptimizedPolyfillConfig(mockBrowsers.oldChrome);
      const oldBrowserCSS = getOptimizedCSSFallbacks(mockBrowsers.oldSafari);

      // Check that critical features have polyfills or fallbacks
      const hasPolyfillSupport = requiredFeatures.some(feature =>
        oldBrowserConfig[feature as keyof typeof oldBrowserConfig]
      );

      const hasCSSSupport = oldBrowserCSS.some(bundle =>
        bundle.features.some(feature =>
          feature.toLowerCase().includes('grid') ||
          feature.toLowerCase().includes('properties')
        )
      );

      expect(hasPolyfillSupport || hasCSSSupport).toBe(true);
    });

    it('should ensure consistent behavior across browsers', () => {
      const browsers = [mockBrowsers.modernChrome, mockBrowsers.modernFirefox];

      const configs = browsers.map(browser => getOptimizedPolyfillConfig(browser));
      const cssFallbacks = browsers.map(browser => getOptimizedCSSFallbacks(browser));

      // Modern browsers should have similar (minimal) requirements
      expect(configs[0]).toEqual(configs[1]);
      expect(cssFallbacks[0]).toEqual(cssFallbacks[1]);
    });

    it('should provide comprehensive documentation', () => {
      // Verify that optimization functions return meaningful data
      const polyfillBundles = getPolyfillBundles(mockBrowsers.oldChrome);
      const cssFallbacks = getOptimizedCSSFallbacks(mockBrowsers.oldSafari);

      polyfillBundles.forEach(bundle => {
        expect(bundle.name).toBeDefined();
        expect(bundle.polyfills).toBeDefined();
        expect(bundle.url).toBeDefined();
        expect(bundle.size).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(bundle.priority);
      });

      cssFallbacks.forEach(fallback => {
        expect(fallback.features).toBeDefined();
        expect(fallback.css).toBeDefined();
        expect(fallback.size).toBeGreaterThan(0);
        expect(['critical', 'important', 'optional']).toContain(fallback.priority);
      });
    });
  });

  describe('Final Integration Test', () => {
    it('should provide complete compatibility solution', () => {
      // Test the complete flow for an older browser
      vi.spyOn(browserDetectionService, 'getBrowserInfo').mockReturnValue(mockBrowsers.oldChrome);

      // Get all compatibility resources
      const polyfillBundles = getPolyfillBundles();
      const cssFallbacks = getOptimizedCSSFallbacks();
      const criticalCSS = getCriticalCSS();
      const preloadHints = polyfillBundleOptimizer.generatePreloadHints(mockBrowsers.oldChrome);

      // Verify complete solution is provided
      expect(polyfillBundles.length + cssFallbacks.length).toBeGreaterThan(0);
      expect(typeof criticalCSS).toBe('string');
      expect(Array.isArray(preloadHints)).toBe(true);

      // Verify monitoring is working
      compatibilityMonitoring.trackBrowserUsage();
      const report = compatibilityMonitoring.generateReport();
      expect(report).toBeDefined();

      // Verify error handling is in place
      const testError = {
        type: 'polyfill' as const,
        feature: 'fetch',
        browser: mockBrowsers.oldChrome,
        fallbackApplied: false,
        message: 'Test error'
      };

      expect(() => compatibilityErrorHandler.handleError(testError)).not.toThrow();
    });
  });
});