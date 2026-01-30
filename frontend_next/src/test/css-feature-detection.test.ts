/**
 * Tests for CSS feature detection system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cssFeatureDetector, cssCompatibility, CSSGridHelper } from '../lib/css-feature-detection';

// Mock DOM environment
const mockWindow = {
  CSS: {
    supports: vi.fn()
  }
};

const mockDocument = {
  createElement: vi.fn(() => ({
    style: {
      getPropertyValue: vi.fn(),
      setProperty: vi.fn(),
      display: '',
      gridTemplateColumns: '',
      flexDirection: '',
      position: '',
      backdropFilter: '',
      clipPath: '',
      aspectRatio: '',
      containerType: '',
      marginInlineStart: '',
      transform: '',
      transformStyle: '',
      transition: '',
      animation: '',
      mask: '',
      filter: ''
    }
  })),
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    }
  },
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

describe('CSS Feature Detection', () => {
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    originalWindow = global.window;
    originalDocument = global.document;
    
    global.window = mockWindow as any;
    global.document = mockDocument as any;
    
    // Reset mocks
    vi.clearAllMocks();
    cssFeatureDetector.clearCache();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe('CSS.supports Detection', () => {
    it('should detect CSS Grid support using CSS.supports', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'display' && value === 'grid';
      });

      const supportsGrid = cssFeatureDetector.detectGrid();
      
      expect(supportsGrid).toBe(true);
      expect(mockWindow.CSS.supports).toHaveBeenCalledWith('display', 'grid');
    });

    it('should detect Flexbox support using CSS.supports', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'display' && value === 'flex';
      });

      const supportsFlexbox = cssFeatureDetector.detectFlexbox();
      
      expect(supportsFlexbox).toBe(true);
      expect(mockWindow.CSS.supports).toHaveBeenCalledWith('display', 'flex');
    });

    it('should detect CSS Custom Properties support', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === '--custom-property' && value === 'value';
      });

      const supportsCustomProps = cssFeatureDetector.detectCustomProperties();
      
      expect(supportsCustomProps).toBe(true);
      expect(mockWindow.CSS.supports).toHaveBeenCalledWith('--custom-property', 'value');
    });

    it('should detect sticky positioning support', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'position' && (value === 'sticky' || value === '-webkit-sticky');
      });

      const supportsSticky = cssFeatureDetector.detectStickyPosition();
      
      expect(supportsSticky).toBe(true);
    });

    it('should detect backdrop-filter support', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'backdrop-filter' && value === 'blur(10px)';
      });

      const supportsBackdrop = cssFeatureDetector.detectBackdropFilter();
      
      expect(supportsBackdrop).toBe(true);
    });
  });

  describe('Style Property Detection', () => {
    it('should fallback to style property detection when CSS.supports fails', () => {
      mockWindow.CSS.supports.mockImplementation(() => false);
      
      const mockElement = {
        style: {
          'grid-template-columns': '',
          'flex-direction': ''
        }
      };
      
      mockDocument.createElement.mockReturnValue(mockElement);

      const supportsGrid = cssFeatureDetector.detectGrid();
      const supportsFlexbox = cssFeatureDetector.detectFlexbox();
      
      expect(supportsGrid).toBe(true);
      expect(supportsFlexbox).toBe(true);
    });

    it('should handle vendor prefixes in style property detection', () => {
      mockWindow.CSS.supports.mockImplementation(() => false);
      
      const mockElement = {
        style: {
          'transform-style': '',
          '-webkit-transform-style': ''
        }
      };
      
      mockDocument.createElement.mockReturnValue(mockElement);

      const supportsTransforms = cssFeatureDetector.detectTransforms3D();
      
      expect(supportsTransforms).toBe(true);
    });
  });

  describe('Feature Support Caching', () => {
    it('should cache detection results', () => {
      mockWindow.CSS.supports.mockImplementation(() => true);

      // First call
      cssFeatureDetector.detectGrid();
      // Second call
      cssFeatureDetector.detectGrid();
      
      // CSS.supports should only be called once due to caching
      // Note: detectGrid calls testSupports twice (for 'display' and fallback)
      expect(mockWindow.CSS.supports).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', () => {
      mockWindow.CSS.supports.mockImplementation(() => true);

      cssFeatureDetector.detectGrid();
      cssFeatureDetector.clearCache();
      cssFeatureDetector.detectGrid();
      
      // Should be called twice after cache clear
      expect(mockWindow.CSS.supports).toHaveBeenCalledTimes(2);
    });
  });

  describe('Comprehensive Feature Detection', () => {
    it('should return complete feature support object', () => {
      mockWindow.CSS.supports.mockImplementation(() => true);
      
      const mockElement = {
        style: {
          'grid-template-columns': '',
          'flex-direction': '',
          'transform-style': '',
          'transition': '',
          'animation': ''
        }
      };
      
      mockDocument.createElement.mockReturnValue(mockElement);

      const features = cssFeatureDetector.getFeatureSupport();
      
      expect(features).toHaveProperty('grid');
      expect(features).toHaveProperty('flexbox');
      expect(features).toHaveProperty('customProperties');
      expect(features).toHaveProperty('stickyPosition');
      expect(features).toHaveProperty('backdropFilter');
      expect(features).toHaveProperty('clipPath');
      expect(features).toHaveProperty('aspectRatio');
      expect(features).toHaveProperty('transforms3d');
      expect(features).toHaveProperty('transitions');
      expect(features).toHaveProperty('animations');
      
      expect(typeof features.grid).toBe('boolean');
      expect(typeof features.flexbox).toBe('boolean');
    });
  });

  describe('CSS Compatibility Helpers', () => {
    it('should add feature classes to HTML element', () => {
      mockWindow.CSS.supports.mockImplementation(() => true);
      
      cssCompatibility.addFeatureClasses();
      
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalled();
    });

    it('should return correct fallback class based on feature support', () => {
      mockWindow.CSS.supports.mockImplementation((prop) => {
        return prop === 'display'; // Only support display property
      });

      const gridClass = cssCompatibility.getFallbackClass('modern-grid', 'fallback-flex', 'grid');
      const flexClass = cssCompatibility.getFallbackClass('modern-flex', 'fallback-block', 'flexbox');
      
      expect(gridClass).toBe('modern-grid');
      expect(flexClass).toBe('modern-flex');
    });

    it('should determine modern layout support correctly', () => {
      mockWindow.CSS.supports.mockImplementation(() => true);
      
      const supportsModern = cssCompatibility.supportsModernLayout();
      
      expect(supportsModern).toBe(true);
    });

    it('should determine advanced effects support correctly', () => {
      mockWindow.CSS.supports.mockImplementation((prop) => {
        return ['backdrop-filter', 'clip-path', 'mask', 'filter'].some(p => prop.includes(p));
      });
      
      const supportsAdvanced = cssCompatibility.supportsAdvancedEffects();
      
      expect(supportsAdvanced).toBe(true);
    });

    it('should recommend appropriate CSS strategy', () => {
      // Test modern strategy
      mockWindow.CSS.supports.mockImplementation(() => true);
      expect(cssCompatibility.getRecommendedStrategy()).toBe('modern');
      
      // Test progressive strategy
      mockWindow.CSS.supports.mockImplementation((prop) => {
        return prop === 'display' || prop === 'transition';
      });
      expect(cssCompatibility.getRecommendedStrategy()).toBe('progressive');
      
      // Test fallback strategy - need to clear cache and mock everything as unsupported
      cssFeatureDetector.clearCache();
      mockWindow.CSS.supports.mockImplementation(() => false);
      const mockElement = { style: {} };
      mockDocument.createElement.mockReturnValue(mockElement);
      expect(cssCompatibility.getRecommendedStrategy()).toBe('fallback');
    });
  });

  describe('CSS Grid Helper', () => {
    it('should create CSS Grid layout when supported', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'display' && value === 'grid';
      });

      const mockContainer = {
        style: {},
        children: []
      };

      CSSGridHelper.createGridLayout(mockContainer as any, 3, '1rem');
      
      expect(mockContainer.style).toEqual({
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem'
      });
    });

    it('should fallback to Flexbox when Grid is not supported', () => {
      mockWindow.CSS.supports.mockImplementation(() => false);

      const mockChild = { style: {} };
      const mockContainer = {
        style: {},
        children: [mockChild]
      };

      CSSGridHelper.createGridLayout(mockContainer as any, 3, '1rem');
      
      expect(mockContainer.style).toEqual({
        display: 'flex',
        flexWrap: 'wrap',
        margin: '-1rem'
      });
      
      expect(mockChild.style).toEqual({
        flex: '1 1 calc(33.333333333333336% - 1rem)',
        margin: '1rem'
      });
    });

    it('should create responsive grid layout', () => {
      mockWindow.CSS.supports.mockImplementation((prop, value) => {
        return prop === 'display' && value === 'grid';
      });

      const mockContainer = {
        style: {},
        children: []
      };

      CSSGridHelper.createResponsiveGrid(mockContainer as any, {});
      
      expect(mockContainer.style).toEqual({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      });
    });
  });

  describe('Server-Side Rendering', () => {
    it('should handle server-side rendering gracefully', () => {
      global.window = undefined as any;
      global.document = undefined as any;
      
      const features = cssFeatureDetector.getFeatureSupport();
      
      // All features should be false on server
      expect(features.grid).toBe(false);
      expect(features.flexbox).toBe(false);
      expect(features.customProperties).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle CSS.supports throwing errors', () => {
      mockWindow.CSS.supports.mockImplementation(() => {
        throw new Error('CSS.supports error');
      });
      
      // Mock createElement to return element without grid support
      const mockElement = { style: {} };
      mockDocument.createElement.mockReturnValue(mockElement);

      expect(() => {
        cssFeatureDetector.detectGrid();
      }).not.toThrow();
      
      const supportsGrid = cssFeatureDetector.detectGrid();
      expect(supportsGrid).toBe(false);
    });

    it('should handle createElement throwing errors', () => {
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('createElement error');
      });

      expect(() => {
        cssFeatureDetector.detectFlexbox();
      }).not.toThrow();
      
      const supportsFlexbox = cssFeatureDetector.detectFlexbox();
      expect(supportsFlexbox).toBe(false);
    });
  });
});