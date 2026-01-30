/**
 * Tests for Polyfill Management System
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { polyfillManager, initializePolyfills, PolyfillConfig } from '../lib/polyfill-manager';
import { browserDetectionService } from '../lib/browser-detection';

// Mock browser detection service
vi.mock('../lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: vi.fn()
  }
}));

// Mock DOM APIs
const mockDocument = {
  createElement: vi.fn(),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

const mockWindow = {
  fetch: undefined as any,
  Promise: undefined as any,
  IntersectionObserver: undefined as any,
  CustomEvent: undefined as any
};

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('Polyfill Manager', () => {
  const mockBrowserDetectionService = browserDetectionService as {
    getBrowserInfo: Mock;
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    polyfillManager.clearCache();
    
    // Reset window properties
    mockWindow.fetch = undefined;
    mockWindow.Promise = undefined;
    mockWindow.IntersectionObserver = undefined;
    mockWindow.CustomEvent = undefined;
    
    // Ensure Object.assign exists for the default config
    if (!Object.assign) {
      Object.assign = (target: any, ...sources: any[]) => {
        sources.forEach(source => {
          if (source) {
            Object.keys(source).forEach(key => {
              target[key] = source[key];
            });
          }
        });
        return target;
      };
    }

    // Setup default browser info
    mockBrowserDetectionService.getBrowserInfo.mockReturnValue({
      name: 'chrome',
      version: 85,
      isSupported: true,
      features: {
        fetch: false,
        promises: false,
        asyncAwait: true,
        cssGrid: true,
        cssFlexbox: true,
        customProperties: true,
        intersectionObserver: false,
        webp: true,
        webm: true,
        mp4: true,
        fileApi: true,
        formData: true,
        customEvent: false,
        objectAssign: false
      }
    });

    // Setup mock script element
    const mockScript = {
      src: '',
      async: false,
      onload: null as any,
      onerror: null as any
    };

    mockDocument.createElement.mockReturnValue(mockScript);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadPolyfills', () => {
    it('should not load polyfills when all features are supported', async () => {
      // Setup browser with all features supported
      mockBrowserDetectionService.getBrowserInfo.mockReturnValue({
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

      const results = await polyfillManager.loadPolyfills();
      
      expect(results).toHaveLength(0);
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should load required polyfills for unsupported features', async () => {
      // Mock successful script loading
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate successful loading
      setTimeout(() => {
        // Simulate polyfills being loaded
        mockWindow.fetch = vi.fn();
        mockWindow.Promise = vi.fn();
        mockWindow.IntersectionObserver = vi.fn();
        mockWindow.CustomEvent = vi.fn();
        Object.assign = vi.fn();
        
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.loaded)).toBe(true);
    });

    it('should apply fallback polyfills when CDN loading fails', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate script loading failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      // Should have attempted to load polyfills
      expect(results.length).toBeGreaterThan(0);
      
      // Some should have fallbacks applied
      const withFallbacks = results.filter(r => r.fallbackApplied);
      expect(withFallbacks.length).toBeGreaterThan(0);
    });

    it('should handle custom polyfill configuration', async () => {
      const customConfig: Partial<PolyfillConfig> = {
        fetch: {
          enabled: false,
          url: '',
          condition: () => false
        },
        promises: {
          enabled: true,
          url: 'https://custom-cdn.com/promise-polyfill.js',
          condition: () => true
        }
      };

      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate successful loading
      setTimeout(() => {
        mockWindow.Promise = vi.fn();
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills(customConfig);
      
      // Should not load fetch polyfill (disabled)
      expect(results.find(r => r.name === 'fetch')).toBeUndefined();
      
      // Should load promises polyfill with custom URL
      const promiseResult = results.find(r => r.name === 'promises');
      expect(promiseResult).toBeDefined();
      expect(promiseResult?.loaded).toBe(true);
    });
  });

  describe('isPolyfillLoaded', () => {
    it('should return false for unloaded polyfills', () => {
      expect(polyfillManager.isPolyfillLoaded('fetch')).toBe(false);
      expect(polyfillManager.isPolyfillLoaded('promises')).toBe(false);
    });

    it('should return true for loaded polyfills', async () => {
      // Mock successful polyfill loading
      mockWindow.fetch = vi.fn();
      
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);

      await polyfillManager.loadPolyfills();
      
      expect(polyfillManager.isPolyfillLoaded('fetch')).toBe(true);
    });
  });

  describe('getLoadedPolyfills', () => {
    it('should return empty array when no polyfills are loaded', () => {
      expect(polyfillManager.getLoadedPolyfills()).toEqual([]);
    });

    it('should return list of loaded polyfills', async () => {
      // Mock successful polyfill loading
      mockWindow.fetch = vi.fn();
      mockWindow.Promise = vi.fn();
      
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);

      await polyfillManager.loadPolyfills();
      
      const loadedPolyfills = polyfillManager.getLoadedPolyfills();
      expect(loadedPolyfills).toContain('fetch');
      expect(loadedPolyfills).toContain('promises');
    });
  });

  describe('clearCache', () => {
    it('should clear loaded polyfills cache', async () => {
      // Load some polyfills first
      mockWindow.fetch = vi.fn();
      
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      setTimeout(() => {
        if (mockScript.onload) {
          mockScript.onload();
        }
      }, 0);

      await polyfillManager.loadPolyfills();
      
      expect(polyfillManager.getLoadedPolyfills().length).toBeGreaterThan(0);
      
      polyfillManager.clearCache();
      
      expect(polyfillManager.getLoadedPolyfills()).toEqual([]);
    });
  });

  describe('initializePolyfills', () => {
    it('should return empty array in server-side environment', async () => {
      // Mock server-side environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });

      const results = await initializePolyfills();
      
      expect(results).toEqual([]);

      // Restore window
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      });
    });

    it('should handle polyfill loading errors gracefully', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate script loading failure without fallback success
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await initializePolyfills();
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Should have some failed results
      const failedResults = results.filter(r => !r.loaded);
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback Polyfills', () => {
    it('should apply fetch fallback polyfill', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      // Mock XMLHttpRequest for fetch fallback
      const mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        onload: null as any,
        onerror: null as any,
        status: 200,
        statusText: 'OK',
        responseText: '{"success": true}'
      };

      Object.defineProperty(global, 'XMLHttpRequest', {
        value: vi.fn(() => mockXHR),
        writable: true
      });

      const results = await polyfillManager.loadPolyfills();
      
      const fetchResult = results.find(r => r.name === 'fetch');
      expect(fetchResult).toBeDefined();
      expect(fetchResult?.fallbackApplied).toBe(true);
      expect(typeof mockWindow.fetch).toBe('function');
    });

    it('should apply Promise fallback polyfill', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      const promiseResult = results.find(r => r.name === 'promises');
      expect(promiseResult).toBeDefined();
      expect(promiseResult?.fallbackApplied).toBe(true);
      expect(typeof mockWindow.Promise).toBe('function');
    });

    it('should apply IntersectionObserver fallback polyfill', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Mock getBoundingClientRect
      const _mockElement = {
        getBoundingClientRect: vi.fn(() => ({
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
          width: 100,
          height: 100
        }))
      };

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      const ioResult = results.find(r => r.name === 'intersectionObserver');
      expect(ioResult).toBeDefined();
      expect(ioResult?.fallbackApplied).toBe(true);
      expect(typeof mockWindow.IntersectionObserver).toBe('function');
    });

    it('should apply CustomEvent fallback polyfill', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Mock document.createEvent
      const mockEvent = {
        initCustomEvent: vi.fn()
      };

      mockDocument.createEvent = vi.fn(() => mockEvent);

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      const customEventResult = results.find(r => r.name === 'customEvent');
      expect(customEventResult).toBeDefined();
      expect(customEventResult?.fallbackApplied).toBe(true);
      expect(typeof mockWindow.CustomEvent).toBe('function');
    });

    it('should apply Object.assign fallback polyfill', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      const results = await polyfillManager.loadPolyfills();
      
      const objectAssignResult = results.find(r => r.name === 'objectAssign');
      expect(objectAssignResult).toBeDefined();
      expect(objectAssignResult?.fallbackApplied).toBe(true);
      expect(typeof Object.assign).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle script loading timeout', async () => {
      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Don't trigger onload or onerror to simulate timeout
      // The timeout is set to 10 seconds in the implementation

      const results = await polyfillManager.loadPolyfills();
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should have some results with fallbacks applied due to timeout
      const resultsWithFallbacks = results.filter(r => r.fallbackApplied);
      expect(resultsWithFallbacks.length).toBeGreaterThan(0);
    });

    it('should handle missing fallback polyfills', async () => {
      // Create a custom config with a polyfill that doesn't have a fallback
      const customConfig: Partial<PolyfillConfig> = {
        fetch: {
          enabled: true,
          url: 'https://invalid-url.com/polyfill.js',
          condition: () => true
        }
      };

      const mockScript = {
        src: '',
        async: false,
        onload: null as any,
        onerror: null as any
      };

      mockDocument.createElement.mockReturnValue(mockScript);

      // Simulate CDN failure
      setTimeout(() => {
        if (mockScript.onerror) {
          mockScript.onerror();
        }
      }, 0);

      // Remove fetch from fallback polyfills temporarily
      const originalFallback = (polyfillManager as any).applyFallbackPolyfill;
      (polyfillManager as any).applyFallbackPolyfill = vi.fn(() => {
        throw new Error('No fallback available');
      });

      const results = await polyfillManager.loadPolyfills(customConfig);
      
      const fetchResult = results.find(r => r.name === 'fetch');
      expect(fetchResult).toBeDefined();
      expect(fetchResult?.loaded).toBe(false);
      expect(fetchResult?.error).toBeDefined();

      // Restore original method
      (polyfillManager as any).applyFallbackPolyfill = originalFallback;
    });
  });
});