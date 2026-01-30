/**
 * CSS Fallback Optimizer
 * Optimizes CSS fallback delivery to reduce redundant code
 */

import { browserDetectionService, BrowserInfo } from './browser-detection';

export interface CSSFeature {
  name: string;
  property: string;
  fallback: string;
  modern: string;
  size: number; // Estimated size impact in bytes
  priority: 'critical' | 'important' | 'optional';
}

export interface OptimizedCSSBundle {
  features: string[];
  css: string;
  size: number;
  priority: 'critical' | 'important' | 'optional';
}

/**
 * CSS Features with optimized fallbacks
 */
const CSS_FEATURES: Record<string, CSSFeature> = {
  cssGrid: {
    name: 'CSS Grid',
    property: 'display',
    fallback: 'flex',
    modern: 'grid',
    size: 512,
    priority: 'critical'
  },
  
  customProperties: {
    name: 'CSS Custom Properties',
    property: 'color',
    fallback: '#333333',
    modern: 'var(--text-color, #333333)',
    size: 256,
    priority: 'important'
  },
  
  flexbox: {
    name: 'Flexbox',
    property: 'display',
    fallback: 'block',
    modern: 'flex',
    size: 384,
    priority: 'critical'
  },
  
  objectFit: {
    name: 'Object Fit',
    property: 'object-fit',
    fallback: 'background-size: cover',
    modern: 'object-fit: cover',
    size: 128,
    priority: 'important'
  },
  
  aspectRatio: {
    name: 'Aspect Ratio',
    property: 'aspect-ratio',
    fallback: 'padding-bottom: 56.25%',
    modern: 'aspect-ratio: 16/9',
    size: 192,
    priority: 'optional'
  },
  
  stickyPosition: {
    name: 'Sticky Position',
    property: 'position',
    fallback: 'relative',
    modern: 'sticky',
    size: 64,
    priority: 'optional'
  }
};

/**
 * CSS Fallback Optimizer Class
 */
export class CSSFallbackOptimizer {
  private maxBundleSize: number;
  private enabledFeatures: Set<string>;

  constructor(maxBundleSize: number = 8192) { // 8KB default max
    this.maxBundleSize = maxBundleSize;
    this.enabledFeatures = new Set(Object.keys(CSS_FEATURES));
  }

  /**
   * Generate optimized CSS fallbacks for browser
   */
  generateOptimizedFallbacks(browserInfo: BrowserInfo): OptimizedCSSBundle[] {
    const requiredFallbacks = this.getRequiredFallbacks(browserInfo);
    
    if (requiredFallbacks.length === 0) {
      return [];
    }

    return this.createOptimizedBundles(requiredFallbacks);
  }

  /**
   * Get required CSS fallbacks for browser
   */
  private getRequiredFallbacks(browserInfo: BrowserInfo): CSSFeature[] {
    const required: CSSFeature[] = [];

    // Check CSS Grid support
    if (!browserInfo.features.cssGrid && this.enabledFeatures.has('cssGrid')) {
      required.push(CSS_FEATURES.cssGrid);
    }

    // Check Custom Properties support
    if (!browserInfo.features.customProperties && this.enabledFeatures.has('customProperties')) {
      required.push(CSS_FEATURES.customProperties);
    }

    // Check Flexbox support (for very old browsers)
    if (!browserInfo.features.cssFlexbox && this.enabledFeatures.has('flexbox')) {
      required.push(CSS_FEATURES.flexbox);
    }

    // Add other features based on browser version
    if (browserInfo.version < 90 && this.enabledFeatures.has('objectFit')) {
      required.push(CSS_FEATURES.objectFit);
    }

    if (browserInfo.version < 88 && this.enabledFeatures.has('aspectRatio')) {
      required.push(CSS_FEATURES.aspectRatio);
    }

    if (browserInfo.version < 85 && this.enabledFeatures.has('stickyPosition')) {
      required.push(CSS_FEATURES.stickyPosition);
    }

    return required;
  }

  /**
   * Create optimized CSS bundles
   */
  private createOptimizedBundles(features: CSSFeature[]): OptimizedCSSBundle[] {
    const bundles: OptimizedCSSBundle[] = [];
    
    // Group by priority
    const priorityGroups = this.groupByPriority(features);
    
    // Create bundles for each priority
    Object.entries(priorityGroups).forEach(([priority, groupFeatures]) => {
      const bundle = this.createCSSBundle(groupFeatures, priority as 'critical' | 'important' | 'optional');
      if (bundle) {
        bundles.push(bundle);
      }
    });

    return bundles;
  }

  /**
   * Group features by priority
   */
  private groupByPriority(features: CSSFeature[]): Record<string, CSSFeature[]> {
    return features.reduce((groups, feature) => {
      const priority = feature.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(feature);
      return groups;
    }, {} as Record<string, CSSFeature[]>);
  }

  /**
   * Create CSS bundle for features
   */
  private createCSSBundle(features: CSSFeature[], priority: 'critical' | 'important' | 'optional'): OptimizedCSSBundle | null {
    if (features.length === 0) return null;

    const css = this.generateOptimizedCSS(features);
    const size = features.reduce((sum, f) => sum + f.size, 0);

    return {
      features: features.map(f => f.name),
      css,
      size,
      priority
    };
  }

  /**
   * Generate optimized CSS with fallbacks
   */
  private generateOptimizedCSS(features: CSSFeature[]): string {
    const cssRules: string[] = [];

    features.forEach(feature => {
      switch (feature.name) {
        case 'CSS Grid':
          cssRules.push(this.generateGridFallbacks());
          break;
        case 'CSS Custom Properties':
          cssRules.push(this.generateCustomPropertiesFallbacks());
          break;
        case 'Flexbox':
          cssRules.push(this.generateFlexboxFallbacks());
          break;
        case 'Object Fit':
          cssRules.push(this.generateObjectFitFallbacks());
          break;
        case 'Aspect Ratio':
          cssRules.push(this.generateAspectRatioFallbacks());
          break;
        case 'Sticky Position':
          cssRules.push(this.generateStickyPositionFallbacks());
          break;
      }
    });

    return cssRules.join('\n\n');
  }

  /**
   * Generate CSS Grid fallbacks
   */
  private generateGridFallbacks(): string {
    return `
/* CSS Grid Fallbacks */
.grid-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grid-container > * {
  flex: 1 1 300px;
  min-width: 0;
}

@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .grid-container > * {
    flex: none;
  }
}

.grid-2-cols {
  display: flex;
  flex-wrap: wrap;
}

.grid-2-cols > * {
  flex: 1 1 calc(50% - 0.5rem);
}

@supports (display: grid) {
  .grid-2-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .grid-2-cols > * {
    flex: none;
  }
}`;
  }

  /**
   * Generate Custom Properties fallbacks
   */
  private generateCustomPropertiesFallbacks(): string {
    return `
/* CSS Custom Properties Fallbacks */
.text-primary {
  color: #1f2937;
  color: var(--color-primary, #1f2937);
}

.text-secondary {
  color: #6b7280;
  color: var(--color-secondary, #6b7280);
}

.bg-primary {
  background-color: #3b82f6;
  background-color: var(--color-primary, #3b82f6);
}

.bg-secondary {
  background-color: #e5e7eb;
  background-color: var(--color-secondary, #e5e7eb);
}

.border-primary {
  border-color: #d1d5db;
  border-color: var(--color-border, #d1d5db);
}`;
  }

  /**
   * Generate Flexbox fallbacks
   */
  private generateFlexboxFallbacks(): string {
    return `
/* Flexbox Fallbacks */
.flex-container {
  display: block;
  overflow: hidden;
}

.flex-container::after {
  content: "";
  display: table;
  clear: both;
}

.flex-item {
  float: left;
  width: 100%;
}

@supports (display: flex) {
  .flex-container {
    display: flex;
  }
  
  .flex-container::after {
    display: none;
  }
  
  .flex-item {
    float: none;
    width: auto;
    flex: 1;
  }
}`;
  }

  /**
   * Generate Object Fit fallbacks
   */
  private generateObjectFitFallbacks(): string {
    return `
/* Object Fit Fallbacks */
.object-cover {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

@supports (object-fit: cover) {
  .object-cover {
    object-fit: cover;
    background: none;
  }
}

.object-contain {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

@supports (object-fit: contain) {
  .object-contain {
    object-fit: contain;
    background: none;
  }
}`;
  }

  /**
   * Generate Aspect Ratio fallbacks
   */
  private generateAspectRatioFallbacks(): string {
    return `
/* Aspect Ratio Fallbacks */
.aspect-video {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 */
}

.aspect-video > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@supports (aspect-ratio: 16/9) {
  .aspect-video {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: 16/9;
  }
  
  .aspect-video > * {
    position: static;
  }
}

.aspect-square {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
}

.aspect-square > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@supports (aspect-ratio: 1) {
  .aspect-square {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: 1;
  }
  
  .aspect-square > * {
    position: static;
  }
}`;
  }

  /**
   * Generate Sticky Position fallbacks
   */
  private generateStickyPositionFallbacks(): string {
    return `
/* Sticky Position Fallbacks */
.sticky-top {
  position: relative;
  top: 0;
}

@supports (position: sticky) {
  .sticky-top {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.sticky-header {
  position: relative;
}

@supports (position: sticky) {
  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 50;
  }
}`;
  }

  /**
   * Generate inline CSS for critical features
   */
  generateInlineCSS(browserInfo: BrowserInfo): string {
    const criticalFeatures = this.getRequiredFallbacks(browserInfo)
      .filter(f => f.priority === 'critical');
    
    if (criticalFeatures.length === 0) {
      return '';
    }

    return this.generateOptimizedCSS(criticalFeatures);
  }

  /**
   * Generate CSS file URLs for non-critical features
   */
  generateCSSFileUrls(browserInfo: BrowserInfo): string[] {
    const nonCriticalFeatures = this.getRequiredFallbacks(browserInfo)
      .filter(f => f.priority !== 'critical');
    
    if (nonCriticalFeatures.length === 0) {
      return [];
    }

    // Group by priority and create file URLs
    const priorityGroups = this.groupByPriority(nonCriticalFeatures);
    const urls: string[] = [];

    Object.keys(priorityGroups).forEach(priority => {
      urls.push(`/css/fallbacks-${priority}.css`);
    });

    return urls;
  }

  /**
   * Calculate total CSS fallback size
   */
  calculateFallbackSize(browserInfo: BrowserInfo): number {
    const requiredFallbacks = this.getRequiredFallbacks(browserInfo);
    return requiredFallbacks.reduce((total, feature) => total + feature.size, 0);
  }

  /**
   * Enable/disable specific CSS features
   */
  setFeatureEnabled(feature: string, enabled: boolean): void {
    if (enabled) {
      this.enabledFeatures.add(feature);
    } else {
      this.enabledFeatures.delete(feature);
    }
  }

  /**
   * Get list of enabled features
   */
  getEnabledFeatures(): string[] {
    return Array.from(this.enabledFeatures);
  }
}

// Export singleton instance
export const cssFallbackOptimizer = new CSSFallbackOptimizer();

/**
 * Utility function to get optimized CSS fallbacks
 */
export function getOptimizedCSSFallbacks(browserInfo?: BrowserInfo): OptimizedCSSBundle[] {
  const browser = browserInfo || browserDetectionService.getBrowserInfo();
  return cssFallbackOptimizer.generateOptimizedFallbacks(browser);
}

/**
 * Utility function to get inline CSS for critical features
 */
export function getCriticalCSS(browserInfo?: BrowserInfo): string {
  const browser = browserInfo || browserDetectionService.getBrowserInfo();
  return cssFallbackOptimizer.generateInlineCSS(browser);
}