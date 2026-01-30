/**
 * Edge case tests for browser detection system
 * Tests unusual user agents, mobile browsers, and edge scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { browserDetectionService } from '../lib/browser-detection';

// Mobile and unusual user agents
const edgeCaseUserAgents = {
  // Mobile browsers
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  mobileChrome: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36',
  mobileFirefox: 'Mozilla/5.0 (Mobile; rv:88.0) Gecko/88.0 Firefox/88.0',
  
  // Embedded browsers
  webview: 'Mozilla/5.0 (Linux; Android 11; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.210 Mobile Safari/537.36',
  electron: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) MyApp/1.0.0 Chrome/90.0.4430.212 Electron/13.1.7 Safari/537.36',
  
  // Legacy browsers
  ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
  oldChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
  oldFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
  oldSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
  
  // Bots and crawlers
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  
  // Unusual formats
  emptyUserAgent: '',
  malformedUserAgent: 'Mozilla/5.0 Chrome Firefox Safari',
  veryLongUserAgent: 'Mozilla/5.0 '.repeat(100) + 'Chrome/90.0.4430.212 Safari/537.36'
};

const mockWindow = {
  navigator: { userAgent: '' },
  fetch: undefined as any,
  Promise: undefined as any,
  IntersectionObserver: undefined as any,
  File: undefined as any,
  FileReader: undefined as any,
  FileList: undefined as any,
  Blob: undefined as any,
  FormData: undefined as any,
  CustomEvent: undefined as any,
  CSS: { supports: undefined as any },
  Object: { assign: undefined as any }
};

describe('Browser Detection Edge Cases', () => {
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    originalWindow = global.window;
    originalDocument = global.document;
    
    global.window = mockWindow as any;
    global.document = {
      createElement: vi.fn(() => ({
        canPlayType: vi.fn(() => ''),
        width: 0,
        height: 0,
        toDataURL: vi.fn(() => 'data:image/png')
      }))
    } as any;
    
    (browserDetectionService as any).browserInfo = null;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('Mobile Browser Detection', () => {
    it('should detect mobile Safari correctly', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileSafari;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('safari');
      expect(browserInfo.version).toBe(14);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect mobile Chrome correctly', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileChrome;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect mobile Firefox correctly', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileFirefox;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('firefox');
      expect(browserInfo.version).toBe(88);
      expect(browserInfo.isSupported).toBe(true);
    });
  });

  describe('Embedded Browser Detection', () => {
    it('should detect WebView as Chrome', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.webview;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect Electron as Chrome', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.electron;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });
  });

  describe('Legacy Browser Detection', () => {
    it('should handle IE11 as unknown', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.ie11;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should detect old Chrome as unsupported', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.oldChrome;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(60);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should detect old Firefox as unsupported', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.oldFirefox;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('firefox');
      expect(browserInfo.version).toBe(60);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should detect old Safari as unsupported', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.oldSafari;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('safari');
      expect(browserInfo.version).toBe(10);
      expect(browserInfo.isSupported).toBe(false);
    });
  });

  describe('Bot and Crawler Detection', () => {
    it('should handle Googlebot as unknown', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.googlebot;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle Bingbot as unknown', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.bingbot;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });
  });

  describe('Malformed User Agent Handling', () => {
    it('should handle empty user agent', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.emptyUserAgent;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle malformed user agent', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.malformedUserAgent;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle very long user agent', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.veryLongUserAgent;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });
  });

  describe('Feature Detection Edge Cases', () => {
    it('should handle partial feature support', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.oldChrome;
      mockWindow.fetch = vi.fn(); // Has fetch
      global.Promise = Promise; // Has Promise
      
      // Temporarily remove IntersectionObserver from window
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;
      delete (mockWindow as any).IntersectionObserver;
      
      mockWindow.CSS = undefined; // Missing CSS.supports
      
      // Reset cache to force re-detection
      (browserDetectionService as any).browserInfo = null;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.fetch).toBe(true);
      expect(browserInfo.features.promises).toBe(true);
      expect(browserInfo.features.intersectionObserver).toBe(false);
      expect(browserInfo.features.cssGrid).toBe(false);
      
      // Restore IntersectionObserver
      global.IntersectionObserver = originalIntersectionObserver;
    });

    it('should handle missing window.CSS entirely', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.oldSafari;
      mockWindow.CSS = undefined;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.cssGrid).toBe(false);
      expect(browserInfo.features.cssFlexbox).toBe(false);
      expect(browserInfo.features.customProperties).toBe(false);
    });

    it('should handle document.createElement failures', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileChrome;
      global.document.createElement = vi.fn(() => {
        throw new Error('createElement failed');
      });
      
      // Should not throw and should handle gracefully
      expect(() => {
        const browserInfo = browserDetectionService.getBrowserInfo();
        expect(browserInfo.features.webp).toBe(false);
        expect(browserInfo.features.webm).toBe(false);
        expect(browserInfo.features.mp4).toBe(false);
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated calls', () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileChrome;
      
      // Call getBrowserInfo multiple times
      for (let i = 0; i < 100; i++) {
        const browserInfo = browserDetectionService.getBrowserInfo();
        expect(browserInfo.name).toBe('chrome');
      }
      
      // Should still return cached result
      const finalInfo = browserDetectionService.getBrowserInfo();
      expect(finalInfo.name).toBe('chrome');
    });

    it('should handle concurrent access', async () => {
      mockWindow.navigator.userAgent = edgeCaseUserAgents.mobileChrome;
      
      // Simulate concurrent calls
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(browserDetectionService.getBrowserInfo())
      );
      
      const results = await Promise.all(promises);
      
      // All results should be identical
      results.forEach(result => {
        expect(result.name).toBe('chrome');
        expect(result.version).toBe(90);
      });
    });
  });

  describe('Browser Version Edge Cases', () => {
    it('should handle missing version numbers', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Chrome Safari/537.36';
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('safari');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle non-numeric version strings', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Chrome/beta Safari/537.36';
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle very high version numbers', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Chrome/999.0.4430.212 Safari/537.36';
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(999);
      expect(browserInfo.isSupported).toBe(true);
    });
  });
});