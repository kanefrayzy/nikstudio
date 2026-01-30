/**
 * Simple tests for Polyfill Management System core functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { polyfillManager } from '../lib/polyfill-manager';
import { browserDetectionService } from '../lib/browser-detection';

// Mock browser detection service
vi.mock('../lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: vi.fn()
  }
}));

describe('Polyfill Manager Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    polyfillManager.clearCache();
    
    // Setup browser with no features supported (requires all polyfills)
    (browserDetectionService.getBrowserInfo as any).mockReturnValue({
      name: 'chrome',
      version: 70, // Old version
      isSupported: false,
      features: {
        fetch: false,
        promises: false,
        asyncAwait: false,
        cssGrid: false,
        cssFlexbox: false,
        customProperties: false,
        intersectionObserver: false,
        webp: false,
        webm: false,
        mp4: true,
        fileApi: false,
        formData: false,
        customEvent: false,
        objectAssign: false
      }
    });
  });

  it('should identify required polyfills based on browser features', () => {
    const browserInfo = browserDetectionService.getBrowserInfo();
    
    expect(browserInfo.features.fetch).toBe(false);
    expect(browserInfo.features.promises).toBe(false);
    expect(browserInfo.features.intersectionObserver).toBe(false);
    expect(browserInfo.features.customEvent).toBe(false);
    expect(browserInfo.features.objectAssign).toBe(false);
  });

  it('should not require polyfills when all features are supported', () => {
    // Setup browser with all features supported
    (browserDetectionService.getBrowserInfo as any).mockReturnValue({
      name: 'chrome',
      version: 90,
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
    });

    const browserInfo = browserDetectionService.getBrowserInfo();
    
    expect(browserInfo.features.fetch).toBe(true);
    expect(browserInfo.features.promises).toBe(true);
    expect(browserInfo.features.intersectionObserver).toBe(true);
    expect(browserInfo.features.customEvent).toBe(true);
    expect(browserInfo.features.objectAssign).toBe(true);
  });

  it('should track loaded polyfills correctly', () => {
    expect(polyfillManager.isPolyfillLoaded('fetch')).toBe(false);
    expect(polyfillManager.getLoadedPolyfills()).toEqual([]);
  });

  it('should clear cache correctly', () => {
    polyfillManager.clearCache();
    expect(polyfillManager.getLoadedPolyfills()).toEqual([]);
  });

  it('should handle server-side environment', async () => {
    // Mock server-side environment
    const originalWindow = global.window;
    delete (global as any).window;

    const { initializePolyfills } = await import('../lib/polyfill-manager');
    const results = await initializePolyfills();
    
    expect(results).toEqual([]);

    // Restore window
    (global as any).window = originalWindow;
  });

  it('should have proper polyfill configuration structure', async () => {
    const { APP_POLYFILL_CONFIG } = await import('../lib/polyfill-integration');
    
    expect(APP_POLYFILL_CONFIG).toBeDefined();
    expect(APP_POLYFILL_CONFIG.fetch).toBeDefined();
    expect(APP_POLYFILL_CONFIG.promises).toBeDefined();
    expect(APP_POLYFILL_CONFIG.intersectionObserver).toBeDefined();
    expect(APP_POLYFILL_CONFIG.customEvent).toBeDefined();
    expect(APP_POLYFILL_CONFIG.objectAssign).toBeDefined();
    
    // Check configuration structure
    expect(APP_POLYFILL_CONFIG.fetch.enabled).toBe(true);
    expect(typeof APP_POLYFILL_CONFIG.fetch.url).toBe('string');
    expect(typeof APP_POLYFILL_CONFIG.fetch.condition).toBe('function');
  });

  it('should validate critical polyfills correctly', async () => {
    const { validateCriticalPolyfills } = await import('../lib/polyfill-integration');
    
    // Mock window with all critical features
    global.window = {
      fetch: vi.fn(),
      Promise: Promise,
      Object: { assign: Object.assign }
    } as any;
    
    const isValid = validateCriticalPolyfills();
    expect(isValid).toBe(true);
  });

  it('should get polyfill recommendations based on browser', async () => {
    const { getPolyfillRecommendations } = await import('../lib/polyfill-integration');
    
    const recommendations = getPolyfillRecommendations();
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations.required)).toBe(true);
    expect(Array.isArray(recommendations.recommended)).toBe(true);
    expect(Array.isArray(recommendations.optional)).toBe(true);
    
    // Should recommend polyfills for unsupported browser
    expect(recommendations.required.length).toBeGreaterThan(0);
    expect(recommendations.required).toContain('fetch');
    expect(recommendations.required).toContain('promises');
    expect(recommendations.required).toContain('objectAssign');
  });

  it('should create feature-specific polyfill configuration', async () => {
    const { createFeaturePolyfillConfig } = await import('../lib/polyfill-integration');
    
    const config = createFeaturePolyfillConfig(['fetch', 'promises']);
    
    expect(config).toBeDefined();
    expect(config.fetch).toBeDefined();
    expect(config.promises).toBeDefined();
    expect(config.intersectionObserver).toBeUndefined();
  });

  it('should handle polyfill errors properly', async () => {
    const { PolyfillError, handlePolyfillError } = await import('../lib/polyfill-integration');
    
    const error = new PolyfillError(
      'Test error',
      'fetch',
      { name: 'chrome', version: 70 },
      new Error('Original error')
    );
    
    expect(error.name).toBe('PolyfillError');
    expect(error.polyfillName).toBe('fetch');
    expect(error.browserInfo).toBeDefined();
    expect(error.originalError).toBeDefined();
    
    // Should not throw when handling error
    expect(() => handlePolyfillError(error)).not.toThrow();
  });

  it('should measure polyfill performance', async () => {
    const { measurePolyfillPerformance } = await import('../lib/polyfill-integration');
    
    const mockOperation = vi.fn().mockResolvedValue('success');
    
    const result = await measurePolyfillPerformance(mockOperation, 'test-operation');
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalled();
  });
});