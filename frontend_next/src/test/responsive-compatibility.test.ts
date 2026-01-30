/**
 * Tests for responsive design compatibility system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { responsiveCompatibility, ResponsiveImageHelper } from '../lib/responsive-compatibility';

// Mock DOM environment
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), addListener: vi.fn() })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  navigator: {
    maxTouchPoints: 0
  }
};

const mockDocument = {
  createElement: vi.fn(),
  querySelector: vi.fn(),
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    }
  },
  addEventListener: vi.fn(),
  body: {}
};

describe('Responsive Design Compatibility', () => {
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    originalWindow = global.window;
    originalDocument = global.document;
    
    global.window = mockWindow as any;
    global.document = mockDocument as any;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('Viewport Setup', () => {
    it('should create viewport meta tag with default config', () => {
      const mockMetas = [
        { name: '', content: '' }, // viewport
        { name: '', content: '' }, // iOS tag 1
        { name: '', content: '' }, // iOS tag 2
        { name: '', content: '' }, // iOS tag 3
        { name: '', content: '' }, // iOS tag 4
        { name: '', content: '' }  // iOS tag 5
      ];
      let metaIndex = 0;
      mockDocument.createElement.mockImplementation(() => mockMetas[metaIndex++]);
      mockDocument.querySelector.mockReturnValue(null);

      responsiveCompatibility.setupViewport();

      expect(mockDocument.createElement).toHaveBeenCalledWith('meta');
      expect(mockMetas[0].name).toBe('viewport');
      expect(mockMetas[0].content).toContain('width=device-width');
      expect(mockMetas[0].content).toContain('initial-scale=1');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockMetas[0]);
    });

    it('should remove existing viewport meta tag', () => {
      const existingMeta = { remove: vi.fn() };
      const newMeta = { name: '', content: '' };
      
      mockDocument.querySelector.mockReturnValue(existingMeta);
      mockDocument.createElement.mockReturnValue(newMeta);

      responsiveCompatibility.setupViewport();

      expect(existingMeta.remove).toHaveBeenCalled();
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(newMeta);
    });

    it('should use custom viewport config', () => {
      const mockMetas = Array.from({ length: 6 }, () => ({ name: '', content: '' }));
      let metaIndex = 0;
      mockDocument.createElement.mockImplementation(() => mockMetas[metaIndex++]);
      mockDocument.querySelector.mockReturnValue(null);

      responsiveCompatibility.setupViewport({
        initialScale: 0.8,
        userScalable: false,
        viewportFit: 'contain'
      });

      expect(mockMetas[0].content).toContain('initial-scale=0.8');
      expect(mockMetas[0].content).toContain('user-scalable=no');
      expect(mockMetas[0].content).toContain('viewport-fit=contain');
    });

    it('should add iOS-specific meta tags', () => {
      const mockMeta = { name: '', content: '' };
      mockDocument.createElement.mockReturnValue(mockMeta);
      mockDocument.querySelector.mockReturnValue(null);

      responsiveCompatibility.setupViewport();

      // Should create multiple meta tags (viewport + iOS tags)
      expect(mockDocument.createElement).toHaveBeenCalledTimes(6); // 1 viewport + 5 iOS tags
    });
  });

  describe('Touch Capabilities Detection', () => {
    it('should detect touch support correctly', () => {
      // Mock touch support
      mockWindow.navigator.maxTouchPoints = 1;
      global.window.ontouchstart = {};

      const capabilities = responsiveCompatibility.detectTouchCapabilities();

      expect(capabilities.touchEvents).toBe(true);
      expect(typeof capabilities.pointerEvents).toBe('boolean');
      expect(typeof capabilities.hoverSupport).toBe('boolean');
    });

    it('should detect no touch support', () => {
      // Mock no touch support
      mockWindow.navigator.maxTouchPoints = 0;
      delete (global.window as any).ontouchstart;

      const capabilities = responsiveCompatibility.detectTouchCapabilities();

      expect(capabilities.touchEvents).toBe(false);
    });

    it('should handle server-side rendering', () => {
      global.window = undefined as any;

      const capabilities = responsiveCompatibility.detectTouchCapabilities();

      expect(capabilities.touchEvents).toBe(false);
      expect(capabilities.pointerEvents).toBe(false);
      expect(capabilities.hoverSupport).toBe(false);
    });
  });

  describe('Breakpoint Detection', () => {
    it('should detect current breakpoint correctly', () => {
      mockWindow.innerWidth = 1024;
      
      const breakpoint = responsiveCompatibility.getCurrentBreakpoint();
      
      expect(breakpoint).toBe('lg');
    });

    it('should detect mobile breakpoint', () => {
      mockWindow.innerWidth = 320;
      
      const breakpoint = responsiveCompatibility.getCurrentBreakpoint();
      
      expect(breakpoint).toBe('xs');
    });

    it('should detect tablet breakpoint', () => {
      mockWindow.innerWidth = 768;
      
      const breakpoint = responsiveCompatibility.getCurrentBreakpoint();
      
      expect(breakpoint).toBe('md');
    });

    it('should detect desktop breakpoint', () => {
      mockWindow.innerWidth = 1280;
      
      const breakpoint = responsiveCompatibility.getCurrentBreakpoint();
      
      expect(breakpoint).toBe('xl');
    });

    it('should match breakpoint correctly', () => {
      mockWindow.innerWidth = 1024;
      
      expect(responsiveCompatibility.matchesBreakpoint('lg')).toBe(true);
      expect(responsiveCompatibility.matchesBreakpoint('xl')).toBe(false);
      expect(responsiveCompatibility.matchesBreakpoint('md')).toBe(true);
    });

    it('should handle server-side rendering for breakpoints', () => {
      global.window = undefined as any;
      
      const breakpoint = responsiveCompatibility.getCurrentBreakpoint();
      const matches = responsiveCompatibility.matchesBreakpoint('md');
      
      expect(breakpoint).toBe('md');
      expect(matches).toBe(false);
    });
  });

  describe('Responsive Classes', () => {
    it('should add responsive classes to document', () => {
      mockWindow.innerWidth = 1024;
      mockWindow.navigator.maxTouchPoints = 1;
      global.window.ontouchstart = {};

      responsiveCompatibility.addResponsiveClasses();

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('lg');
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('touch');
    });

    it('should remove existing classes before adding new ones', () => {
      responsiveCompatibility.addResponsiveClasses();

      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
        'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
      );
      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith(
        'touch', 'no-touch', 'hover', 'no-hover'
      );
    });
  });

  describe('Responsive Event Listeners', () => {
    it('should set up resize and orientation change listeners', () => {
      responsiveCompatibility.setupResponsiveListeners();

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });

  describe('Media Query Creation', () => {
    it('should create media query with modern API', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn()
      };
      mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

      const callback = vi.fn();
      const result = responsiveCompatibility.createMediaQuery('(min-width: 768px)', callback);

      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(callback).toHaveBeenCalledWith(true);
      expect(result).toBe(mockMediaQuery);
    });

    it('should fallback to legacy API', () => {
      const mockMediaQuery = {
        matches: false,
        addListener: vi.fn()
      };
      mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

      const callback = vi.fn();
      responsiveCompatibility.createMediaQuery('(max-width: 767px)', callback);

      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(expect.any(Function));
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should handle media query errors gracefully', () => {
      mockWindow.matchMedia.mockImplementation(() => {
        throw new Error('Media query not supported');
      });

      const callback = vi.fn();
      const result = responsiveCompatibility.createMediaQuery('(invalid-query)', callback);

      expect(result).toBe(null);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return null on server-side', () => {
      global.window = undefined as any;

      const callback = vi.fn();
      const result = responsiveCompatibility.createMediaQuery('(min-width: 768px)', callback);

      expect(result).toBe(null);
    });
  });

  describe('Responsive Image Creation', () => {
    it('should create responsive image with srcset', () => {
      const mockImg = {
        src: '',
        alt: '',
        srcset: '',
        sizes: '',
        loading: '',
        className: ''
      };
      mockDocument.createElement.mockReturnValue(mockImg);

      const _img = responsiveCompatibility.createResponsiveImage({
        src: '/image.jpg',
        alt: 'Test image',
        srcset: '/image-320.jpg 320w, /image-640.jpg 640w',
        sizes: '(max-width: 640px) 100vw, 50vw',
        loading: 'lazy',
        className: 'responsive-img'
      });

      expect(mockDocument.createElement).toHaveBeenCalledWith('img');
      expect(mockImg.src).toBe('/image.jpg');
      expect(mockImg.alt).toBe('Test image');
      expect(mockImg.srcset).toBe('/image-320.jpg 320w, /image-640.jpg 640w');
      expect(mockImg.sizes).toBe('(max-width: 640px) 100vw, 50vw');
      expect(mockImg.loading).toBe('lazy');
      expect(mockImg.className).toBe('responsive-img');
    });

    it('should handle srcset fallback for unsupported browsers', () => {
      const mockImg = {
        src: '',
        alt: '',
        className: '',
        get srcset() { return undefined; }, // Simulate browser without srcset support
        set srcset(value) { /* no-op */ }
      };
      mockDocument.createElement.mockReturnValue(mockImg);

      responsiveCompatibility.createResponsiveImage({
        src: '/image.jpg',
        alt: 'Test image',
        srcset: '/image-320.jpg 320w, /image-640.jpg 640w'
      });

      // Should use first image from srcset as fallback
      expect(mockImg.src).toBe('/image-320.jpg');
    });
  });

  describe('SrcSet and Sizes Generation', () => {
    it('should generate srcset correctly', () => {
      const srcset = responsiveCompatibility.generateSrcSet('/image.jpg', [320, 640, 1024]);
      
      expect(srcset).toBe('/image.jpg?w=320 320w, /image.jpg?w=640 640w, /image.jpg?w=1024 1024w');
    });

    it('should generate sizes attribute correctly', () => {
      const sizes = responsiveCompatibility.generateSizes({
        sm: '100vw',
        md: '50vw',
        lg: '33vw'
      });
      
      expect(sizes).toContain('(min-width: 640px) 100vw');
      expect(sizes).toContain('(min-width: 768px) 50vw');
      expect(sizes).toContain('33vw');
    });
  });

  describe('Touch Interaction Setup', () => {
    it('should add touch-specific styles when touch is supported', () => {
      // Mock touch support properly
      mockWindow.navigator.maxTouchPoints = 1;
      global.window.ontouchstart = {};
      mockWindow.matchMedia = vi.fn(() => ({ matches: false }));
      
      const mockStyle = { textContent: '' };
      mockDocument.createElement.mockReturnValue(mockStyle);

      responsiveCompatibility.setupTouchInteractions();

      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
      expect(mockStyle.textContent).toContain('min-height: 44px');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(mockStyle);
    });

    it('should set up touch event listeners', () => {
      responsiveCompatibility.setupTouchInteractions();

      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });
  });
});

describe('ResponsiveImageHelper', () => {
  let originalDocument: any;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = mockDocument as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  describe('Image Creation', () => {
    it('should create responsive image with default breakpoints', () => {
      const mockImg = {
        src: '',
        alt: '',
        srcset: '',
        sizes: '',
        loading: '',
        className: ''
      };
      mockDocument.createElement.mockReturnValue(mockImg);

      const _img2 = ResponsiveImageHelper.create({
        src: '/image.jpg',
        alt: 'Test image',
        loading: 'lazy',
        className: 'test-img'
      });

      expect(mockDocument.createElement).toHaveBeenCalledWith('img');
      expect(mockImg.src).toBe('/image.jpg');
      expect(mockImg.alt).toBe('Test image');
      expect(mockImg.srcset).toContain('320w');
      expect(mockImg.srcset).toContain('640w');
      expect(mockImg.sizes).toBe('100vw');
      expect(mockImg.loading).toBe('lazy');
      expect(mockImg.className).toBe('test-img');
    });

    it('should create responsive image with custom breakpoints and sizes', () => {
      const mockImg = {
        src: '',
        alt: '',
        srcset: '',
        sizes: '',
        loading: '',
        className: ''
      };
      mockDocument.createElement.mockReturnValue(mockImg);

      ResponsiveImageHelper.create({
        src: '/image.jpg',
        alt: 'Test image',
        breakpoints: { sm: 400, md: 800 },
        sizes: { sm: '100vw', md: '50vw' }
      });

      expect(mockImg.srcset).toContain('400w');
      expect(mockImg.srcset).toContain('800w');
      expect(mockImg.sizes).toContain('(min-width: 640px) 100vw');
      expect(mockImg.sizes).toContain('50vw');
    });
  });

  describe('Picture Element Creation', () => {
    it('should create picture element with sources and fallback', () => {
      const mockPicture = {
        className: '',
        appendChild: vi.fn()
      };
      const mockSource = {
        media: '',
        srcset: '',
        type: ''
      };
      const mockImg = {
        src: '',
        alt: ''
      };

      mockDocument.createElement
        .mockReturnValueOnce(mockPicture)
        .mockReturnValueOnce(mockSource)
        .mockReturnValueOnce(mockSource)
        .mockReturnValueOnce(mockImg);

      const _picture = ResponsiveImageHelper.createPicture({
        sources: [
          { media: '(min-width: 768px)', srcset: '/large.jpg', type: 'image/jpeg' },
          { media: '(max-width: 767px)', srcset: '/small.jpg' }
        ],
        fallback: { src: '/fallback.jpg', alt: 'Fallback image' },
        className: 'test-picture'
      });

      expect(mockDocument.createElement).toHaveBeenCalledWith('picture');
      expect(mockDocument.createElement).toHaveBeenCalledWith('source');
      expect(mockDocument.createElement).toHaveBeenCalledWith('img');
      expect(mockPicture.className).toBe('test-picture');
      expect(mockPicture.appendChild).toHaveBeenCalledTimes(3); // 2 sources + 1 img
      expect(mockImg.src).toBe('/fallback.jpg');
      expect(mockImg.alt).toBe('Fallback image');
    });
  });
});