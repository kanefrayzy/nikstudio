/**
 * CSS Feature Detection Utilities
 * Runtime CSS feature detection and compatibility helpers
 */

export interface CSSFeatureSupport {
  grid: boolean;
  flexbox: boolean;
  customProperties: boolean;
  supports: boolean;
  stickyPosition: boolean;
  backdropFilter: boolean;
  clipPath: boolean;
  aspectRatio: boolean;
  containerQueries: boolean;
  cssNesting: boolean;
  logicalProperties: boolean;
  colorFunctions: boolean;
  transforms3d: boolean;
  transitions: boolean;
  animations: boolean;
  masks: boolean;
  filters: boolean;
}

/**
 * Detect CSS feature support using various methods
 */
class CSSFeatureDetector {
  private cache: Map<string, boolean> = new Map();
  private isServer = typeof window === 'undefined';

  /**
   * Check if CSS.supports is available
   */
  private hasSupportsAPI(): boolean {
    return !this.isServer && typeof window !== 'undefined' && 'CSS' in window && 'supports' in window.CSS;
  }

  /**
   * Test CSS property support using CSS.supports
   */
  private testSupports(property: string, value: string): boolean {
    if (!this.hasSupportsAPI()) return false;
    
    try {
      return window.CSS.supports(property, value);
    } catch {
      return false;
    }
  }

  /**
   * Test CSS property support using element style
   */
  private testStyleProperty(property: string): boolean {
    if (this.isServer) return false;
    
    const cacheKey = `style-${property}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const element = document.createElement('div');
      const prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];
      
      for (const prefix of prefixes) {
        const prefixedProperty = prefix + property;
        if (prefixedProperty in element.style) {
          this.cache.set(cacheKey, true);
          return true;
        }
      }
      
      this.cache.set(cacheKey, false);
      return false;
    } catch {
      this.cache.set(cacheKey, false);
      return false;
    }
  }

  /**
   * Test CSS value support by setting it on an element
   */
  private testStyleValue(property: string, value: string): boolean {
    if (this.isServer) return false;
    
    const cacheKey = `value-${property}-${value}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const element = document.createElement('div');
      const originalValue = element.style.getPropertyValue(property);
      
      element.style.setProperty(property, value);
      const newValue = element.style.getPropertyValue(property);
      
      const supported = newValue === value || newValue !== originalValue;
      this.cache.set(cacheKey, supported);
      return supported;
    } catch {
      this.cache.set(cacheKey, false);
      return false;
    }
  }

  /**
   * Detect CSS Grid support
   */
  detectGrid(): boolean {
    const cacheKey = 'grid-support';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const supported = this.testSupports('display', 'grid') || 
                     this.testStyleProperty('grid-template-columns');
    
    this.cache.set(cacheKey, supported);
    return supported;
  }

  /**
   * Detect Flexbox support
   */
  detectFlexbox(): boolean {
    const cacheKey = 'flexbox-support';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const supported = this.testSupports('display', 'flex') || 
                     this.testStyleProperty('flex-direction');
    
    this.cache.set(cacheKey, supported);
    return supported;
  }

  /**
   * Detect CSS Custom Properties support
   */
  detectCustomProperties(): boolean {
    return this.testSupports('--custom-property', 'value') ||
           this.testStyleValue('--test-property', 'test-value');
  }

  /**
   * Detect sticky positioning support
   */
  detectStickyPosition(): boolean {
    return this.testSupports('position', 'sticky') ||
           this.testSupports('position', '-webkit-sticky');
  }

  /**
   * Detect backdrop-filter support
   */
  detectBackdropFilter(): boolean {
    return this.testSupports('backdrop-filter', 'blur(10px)') ||
           this.testSupports('-webkit-backdrop-filter', 'blur(10px)');
  }

  /**
   * Detect clip-path support
   */
  detectClipPath(): boolean {
    return this.testSupports('clip-path', 'circle(50%)') ||
           this.testSupports('-webkit-clip-path', 'circle(50%)');
  }

  /**
   * Detect aspect-ratio support
   */
  detectAspectRatio(): boolean {
    return this.testSupports('aspect-ratio', '1');
  }

  /**
   * Detect container queries support
   */
  detectContainerQueries(): boolean {
    return this.testSupports('container-type', 'inline-size');
  }

  /**
   * Detect CSS nesting support
   */
  detectCSSNesting(): boolean {
    if (this.isServer) return false;
    
    try {
      const style = document.createElement('style');
      style.textContent = '.test { & .nested { color: red; } }';
      document.head.appendChild(style);
      
      const rules = style.sheet?.cssRules || [];
      const hasNesting = rules.length > 0 && 
                        rules[0].cssText.includes('nested');
      
      document.head.removeChild(style);
      return hasNesting;
    } catch {
      return false;
    }
  }

  /**
   * Detect logical properties support
   */
  detectLogicalProperties(): boolean {
    return this.testSupports('margin-inline-start', '10px');
  }

  /**
   * Detect modern color functions support
   */
  detectColorFunctions(): boolean {
    return this.testSupports('color', 'oklch(0.7 0.15 180)') ||
           this.testSupports('color', 'color(display-p3 1 0 0)');
  }

  /**
   * Detect 3D transforms support
   */
  detectTransforms3D(): boolean {
    return this.testSupports('transform', 'translateZ(0)') ||
           this.testStyleProperty('transform-style');
  }

  /**
   * Detect CSS transitions support
   */
  detectTransitions(): boolean {
    return this.testStyleProperty('transition');
  }

  /**
   * Detect CSS animations support
   */
  detectAnimations(): boolean {
    return this.testStyleProperty('animation');
  }

  /**
   * Detect CSS masks support
   */
  detectMasks(): boolean {
    return this.testSupports('-webkit-mask', 'linear-gradient(black, transparent)') ||
           this.testSupports('mask', 'linear-gradient(black, transparent)');
  }

  /**
   * Detect CSS filters support
   */
  detectFilters(): boolean {
    return this.testSupports('filter', 'blur(5px)') ||
           this.testSupports('-webkit-filter', 'blur(5px)');
  }

  /**
   * Get comprehensive CSS feature support
   */
  getFeatureSupport(): CSSFeatureSupport {
    return {
      grid: this.detectGrid(),
      flexbox: this.detectFlexbox(),
      customProperties: this.detectCustomProperties(),
      supports: this.hasSupportsAPI(),
      stickyPosition: this.detectStickyPosition(),
      backdropFilter: this.detectBackdropFilter(),
      clipPath: this.detectClipPath(),
      aspectRatio: this.detectAspectRatio(),
      containerQueries: this.detectContainerQueries(),
      cssNesting: this.detectCSSNesting(),
      logicalProperties: this.detectLogicalProperties(),
      colorFunctions: this.detectColorFunctions(),
      transforms3d: this.detectTransforms3D(),
      transitions: this.detectTransitions(),
      animations: this.detectAnimations(),
      masks: this.detectMasks(),
      filters: this.detectFilters()
    };
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const cssFeatureDetector = new CSSFeatureDetector();

/**
 * CSS Compatibility Helper Functions
 */
export const cssCompatibility = {
  /**
   * Add CSS classes based on feature support
   */
  addFeatureClasses(): void {
    if (typeof document === 'undefined') return;

    const features = cssFeatureDetector.getFeatureSupport();
    const html = document.documentElement;

    // Add feature support classes
    Object.entries(features).forEach(([feature, supported]) => {
      const className = supported ? `supports-${feature}` : `no-${feature}`;
      html.classList.add(className);
    });
  },

  /**
   * Get CSS fallback class based on feature support
   */
  getFallbackClass(modernClass: string, fallbackClass: string, feature: keyof CSSFeatureSupport): string {
    const features = cssFeatureDetector.getFeatureSupport();
    return features[feature] ? modernClass : fallbackClass;
  },

  /**
   * Apply conditional CSS based on feature support
   */
  applyConditionalCSS(element: HTMLElement, modernStyles: Partial<CSSStyleDeclaration>, fallbackStyles: Partial<CSSStyleDeclaration>, feature: keyof CSSFeatureSupport): void {
    const features = cssFeatureDetector.getFeatureSupport();
    const styles = features[feature] ? modernStyles : fallbackStyles;

    Object.assign(element.style, styles);
  },

  /**
   * Check if modern layout features are supported
   */
  supportsModernLayout(): boolean {
    const features = cssFeatureDetector.getFeatureSupport();
    return features.grid && features.flexbox && features.customProperties;
  },

  /**
   * Check if advanced visual effects are supported
   */
  supportsAdvancedEffects(): boolean {
    const features = cssFeatureDetector.getFeatureSupport();
    return features.backdropFilter && features.clipPath && features.masks && features.filters;
  },

  /**
   * Get recommended CSS strategy based on browser support
   */
  getRecommendedStrategy(): 'modern' | 'progressive' | 'fallback' {
    const features = cssFeatureDetector.getFeatureSupport();
    
    if (features.grid && features.customProperties && features.supports) {
      return 'modern';
    } else if (features.flexbox && features.transitions) {
      return 'progressive';
    } else {
      return 'fallback';
    }
  }
};

/**
 * React hook for CSS feature detection
 */
export function useCSSFeatureDetection() {
  const [features, setFeatures] = React.useState<CSSFeatureSupport | null>(null);
  const [strategy, setStrategy] = React.useState<'modern' | 'progressive' | 'fallback'>('fallback');

  React.useEffect(() => {
    const detectedFeatures = cssFeatureDetector.getFeatureSupport();
    const recommendedStrategy = cssCompatibility.getRecommendedStrategy();
    
    setFeatures(detectedFeatures);
    setStrategy(recommendedStrategy);
    
    // Add feature classes to HTML element
    cssCompatibility.addFeatureClasses();
  }, []);

  return {
    features,
    strategy,
    supportsModernLayout: cssCompatibility.supportsModernLayout(),
    supportsAdvancedEffects: cssCompatibility.supportsAdvancedEffects(),
    getFallbackClass: cssCompatibility.getFallbackClass,
    applyConditionalCSS: cssCompatibility.applyConditionalCSS
  };
}

/**
 * CSS Grid Layout Helper
 */
export class CSSGridHelper {
  static createGridLayout(container: HTMLElement, columns: number, gap: string = '1rem'): void {
    const gridSupported = cssFeatureDetector.detectGrid();
    
    if (gridSupported) {
      // Use CSS Grid
      container.style.display = 'grid';
      container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      container.style.gap = gap;
    } else {
      // Fallback to Flexbox
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.margin = `-${gap}`;
      
      // Apply flex properties to children
      Array.from(container.children).forEach((child) => {
        const element = child as HTMLElement;
        element.style.flex = `1 1 calc(${100 / columns}% - ${gap})`;
        element.style.margin = gap;
      });
    }
  }

  static createResponsiveGrid(container: HTMLElement, _breakpoints: { [key: string]: number }): void {
    const features = cssFeatureDetector.getFeatureSupport();
    
    if (features.grid) {
      // Use CSS Grid with auto-fit
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.gap = '1rem';
    } else {
      // Fallback to Flexbox with media queries
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      
      Array.from(container.children).forEach((child) => {
        const element = child as HTMLElement;
        element.style.flex = '1 1 250px';
        element.style.margin = '0.5rem';
      });
    }
  }
}

// Import React for the hook
import React from 'react';