/**
 * Unit tests for browser detection and feature detection system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { browserDetectionService, featureDetection } from '../lib/browser-detection';

// Mock user agents for different browsers
const mockUserAgents = {
  chrome90: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
  chrome85: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
  firefox88: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
  firefox75: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0',
  safari14: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  safari11: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
  edge90: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Edg/90.0.818.66',
  edge79: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 Safari/537.36 Edg/79.0.309.43',
  unknown: 'Mozilla/5.0 (compatible; UnknownBot/1.0)'
};

// Mock window object
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
  CSS: {
    supports: undefined as any
  },
  Object: {
    assign: undefined as any
  }
};

describe('Browser Detection System', () => {
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    // Store original globals
    originalWindow = global.window;
    originalDocument = global.document;
    
    // Mock window and document
    global.window = mockWindow as any;
    global.document = {
      createElement: vi.fn(() => ({
        canPlayType: vi.fn(() => ''),
        width: 0,
        height: 0,
        toDataURL: vi.fn(() => 'data:image/png')
      }))
    } as any;
    
    // Reset browser detection service cache
    (browserDetectionService as any).browserInfo = null;
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('Browser Detection', () => {
    it('should detect Chrome correctly', () => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect older Chrome as supported', () => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome85;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('chrome');
      expect(browserInfo.version).toBe(85);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect Firefox correctly', () => {
      mockWindow.navigator.userAgent = mockUserAgents.firefox88;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('firefox');
      expect(browserInfo.version).toBe(88);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect older Firefox as unsupported', () => {
      mockWindow.navigator.userAgent = mockUserAgents.firefox75;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('firefox');
      expect(browserInfo.version).toBe(75);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should detect Safari correctly', () => {
      mockWindow.navigator.userAgent = mockUserAgents.safari14;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('safari');
      expect(browserInfo.version).toBe(14);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect older Safari as unsupported', () => {
      mockWindow.navigator.userAgent = mockUserAgents.safari11;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('safari');
      expect(browserInfo.version).toBe(11);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should detect Edge correctly', () => {
      mockWindow.navigator.userAgent = mockUserAgents.edge90;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('edge');
      expect(browserInfo.version).toBe(90);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should detect older Edge as supported', () => {
      mockWindow.navigator.userAgent = mockUserAgents.edge79;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('edge');
      expect(browserInfo.version).toBe(79);
      expect(browserInfo.isSupported).toBe(true);
    });

    it('should handle unknown browsers', () => {
      mockWindow.navigator.userAgent = mockUserAgents.unknown;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });

    it('should handle server-side rendering (no window)', () => {
      global.window = undefined as any;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.name).toBe('unknown');
      expect(browserInfo.version).toBe(0);
      expect(browserInfo.isSupported).toBe(false);
    });
  });

  describe('JavaScript Feature Detection', () => {
    beforeEach(() => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
    });

    it('should detect fetch API support', () => {
      mockWindow.fetch = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.fetch).toBe(true);
    });

    it('should detect missing fetch API', () => {
      mockWindow.fetch = undefined;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.fetch).toBe(false);
    });

    it('should detect Promise support', () => {
      global.Promise = Promise;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.promises).toBe(true);
    });

    it('should detect missing Promise support', () => {
      const originalPromise = global.Promise;
      global.Promise = undefined as any;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.promises).toBe(false);
      
      // Restore Promise
      global.Promise = originalPromise;
    });

    it('should detect IntersectionObserver support', () => {
      mockWindow.IntersectionObserver = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.intersectionObserver).toBe(true);
    });

    it('should detect File API support', () => {
      mockWindow.File = vi.fn();
      mockWindow.FileReader = vi.fn();
      mockWindow.FileList = vi.fn();
      mockWindow.Blob = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.fileApi).toBe(true);
    });

    it('should detect FormData support', () => {
      mockWindow.FormData = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.formData).toBe(true);
    });

    it('should detect CustomEvent support', () => {
      mockWindow.CustomEvent = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.customEvent).toBe(true);
    });

    it('should detect Object.assign support', () => {
      global.Object.assign = vi.fn();
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.objectAssign).toBe(true);
    });
  });

  describe('CSS Feature Detection', () => {
    beforeEach(() => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
    });

    it('should detect CSS Grid support', () => {
      mockWindow.CSS.supports = vi.fn((property, value) => {
        return property === 'display' && value === 'grid';
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.cssGrid).toBe(true);
    });

    it('should detect CSS Flexbox support', () => {
      mockWindow.CSS.supports = vi.fn((property, value) => {
        return property === 'display' && value === 'flex';
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.cssFlexbox).toBe(true);
    });

    it('should detect CSS Custom Properties support', () => {
      mockWindow.CSS.supports = vi.fn((property, value) => {
        return property === '--custom-property' && value === 'value';
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.customProperties).toBe(true);
    });

    it('should handle missing CSS.supports', () => {
      mockWindow.CSS.supports = undefined;
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.cssGrid).toBe(false);
      expect(browserInfo.features.cssFlexbox).toBe(false);
      expect(browserInfo.features.customProperties).toBe(false);
    });
  });

  describe('Media Format Detection', () => {
    beforeEach(() => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
    });

    it('should detect WebP support', () => {
      const mockCanvas = {
        width: 1,
        height: 1,
        toDataURL: vi.fn(() => 'data:image/webp;base64,test')
      };
      
      global.document.createElement = vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas;
        return { canPlayType: vi.fn(() => '') };
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.webp).toBe(true);
    });

    it('should detect WebM video support', () => {
      const mockVideo = {
        canPlayType: vi.fn((type) => {
          return type === 'video/webm; codecs="vp8, vorbis"' ? 'probably' : '';
        })
      };
      
      global.document.createElement = vi.fn((tag) => {
        if (tag === 'video') return mockVideo;
        return { width: 1, height: 1, toDataURL: vi.fn(() => 'data:image/png') };
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.webm).toBe(true);
    });

    it('should detect MP4 video support', () => {
      const mockVideo = {
        canPlayType: vi.fn((type) => {
          return type === 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ? 'probably' : '';
        })
      };
      
      global.document.createElement = vi.fn((tag) => {
        if (tag === 'video') return mockVideo;
        return { width: 1, height: 1, toDataURL: vi.fn(() => 'data:image/png') };
      });
      
      const browserInfo = browserDetectionService.getBrowserInfo();
      
      expect(browserInfo.features.mp4).toBe(true);
    });
  });

  describe('Feature Detection Service Methods', () => {
    beforeEach(() => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
      mockWindow.fetch = vi.fn();
      mockWindow.CSS.supports = vi.fn(() => true);
    });

    it('should check if feature is supported', () => {
      expect(browserDetectionService.supportsFeature('fetch')).toBe(true);
      expect(browserDetectionService.supportsFeature('nonexistent')).toBe(false);
    });

    it('should check if polyfill is required', () => {
      expect(browserDetectionService.requiresPolyfill('fetch')).toBe(false);
      expect(browserDetectionService.requiresPolyfill('nonexistent')).toBe(true);
    });
  });

  describe('Feature Detection Utilities', () => {
    beforeEach(() => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
    });

    it('should check modern JavaScript support', () => {
      mockWindow.fetch = vi.fn();
      global.Promise = Promise;
      
      expect(featureDetection.supportsModernJS()).toBe(true);
    });

    it('should check modern CSS support', () => {
      mockWindow.CSS.supports = vi.fn(() => true);
      
      expect(featureDetection.supportsModernCSS()).toBe(true);
    });

    it('should check file upload support', () => {
      mockWindow.File = vi.fn();
      mockWindow.FileReader = vi.fn();
      mockWindow.FileList = vi.fn();
      mockWindow.Blob = vi.fn();
      mockWindow.FormData = vi.fn();
      
      expect(featureDetection.supportsFileUpload()).toBe(true);
    });

    it('should get required polyfills list', () => {
      mockWindow.fetch = undefined;
      global.Promise = undefined as any;
      mockWindow.IntersectionObserver = undefined;
      
      const polyfills = featureDetection.getRequiredPolyfills();
      
      expect(polyfills).toContain('fetch');
      expect(polyfills).toContain('promises');
      expect(polyfills).toContain('intersectionObserver');
    });
  });

  describe('Caching Behavior', () => {
    it('should cache browser info after first call', () => {
      mockWindow.navigator.userAgent = mockUserAgents.chrome90;
      
      const info1 = browserDetectionService.getBrowserInfo();
      const info2 = browserDetectionService.getBrowserInfo();
      
      expect(info1).toBe(info2); // Same object reference
    });
  });
});