/**
 * Polyfill Bundle Optimizer
 * Minimizes polyfill bundle sizes by loading only necessary polyfills
 */

import { browserDetectionService, BrowserInfo } from './browser-detection';
import { PolyfillConfig } from './polyfill-manager';

export interface OptimizedPolyfillConfig {
  enabled: boolean;
  url: string;
  size: number; // Estimated size in bytes
  priority: 'high' | 'medium' | 'low';
  condition: (browser: BrowserInfo) => boolean;
}

export interface PolyfillBundle {
  name: string;
  polyfills: string[];
  url: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Optimized polyfill configuration with size estimates
 */
const OPTIMIZED_POLYFILL_CONFIG: Record<string, OptimizedPolyfillConfig> = {
  // Critical polyfills (high priority)
  fetch: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=fetch&flags=gated',
    size: 2048, // ~2KB
    priority: 'high',
    condition: (browser) => !browser.features.fetch
  },
  
  promises: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=Promise&flags=gated',
    size: 3072, // ~3KB
    priority: 'high',
    condition: (browser) => !browser.features.promises
  },

  // Medium priority polyfills
  intersectionObserver: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver&flags=gated',
    size: 4096, // ~4KB
    priority: 'medium',
    condition: (browser) => !browser.features.intersectionObserver
  },

  customEvent: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=CustomEvent&flags=gated',
    size: 512, // ~0.5KB
    priority: 'medium',
    condition: (browser) => !browser.features.customEvent
  },

  // Low priority polyfills
  objectAssign: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=Object.assign&flags=gated',
    size: 1024, // ~1KB
    priority: 'low',
    condition: (browser) => !browser.features.objectAssign
  }
};

/**
 * Polyfill Bundle Optimizer Class
 */
export class PolyfillBundleOptimizer {
  private maxBundleSize: number;
  private priorityWeights: Record<string, number>;

  constructor(maxBundleSize: number = 15360) { // 15KB default max
    this.maxBundleSize = maxBundleSize;
    this.priorityWeights = {
      high: 3,
      medium: 2,
      low: 1
    };
  }

  /**
   * Generate optimized polyfill bundles based on browser capabilities
   */
  generateOptimizedBundles(browserInfo: BrowserInfo): PolyfillBundle[] {
    const requiredPolyfills = this.getRequiredPolyfills(browserInfo);
    
    if (requiredPolyfills.length === 0) {
      return [];
    }

    // Sort by priority and size
    const sortedPolyfills = this.sortPolyfillsByPriority(requiredPolyfills);
    
    // Create optimized bundles
    return this.createOptimizedBundles(sortedPolyfills);
  }

  /**
   * Get list of required polyfills for the browser
   */
  private getRequiredPolyfills(browserInfo: BrowserInfo): Array<{name: string, config: OptimizedPolyfillConfig}> {
    return Object.entries(OPTIMIZED_POLYFILL_CONFIG)
      .filter(([_name, config]) => config.enabled && config.condition(browserInfo))
      .map(([name, config]) => ({ name, config }));
  }

  /**
   * Sort polyfills by priority and size efficiency
   */
  private sortPolyfillsByPriority(polyfills: Array<{name: string, config: OptimizedPolyfillConfig}>) {
    return polyfills.sort((a, b) => {
      // First sort by priority
      const priorityDiff = this.priorityWeights[b.config.priority] - this.priorityWeights[a.config.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by size (smaller first)
      return a.config.size - b.config.size;
    });
  }

  /**
   * Create optimized bundles that respect size limits
   */
  private createOptimizedBundles(sortedPolyfills: Array<{name: string, config: OptimizedPolyfillConfig}>): PolyfillBundle[] {
    const bundles: PolyfillBundle[] = [];
    
    // Group by priority
    const priorityGroups = this.groupByPriority(sortedPolyfills);
    
    // Create bundles for each priority group
    Object.entries(priorityGroups).forEach(([priority, polyfills]) => {
      const bundle = this.createSingleBundle(polyfills, priority as 'high' | 'medium' | 'low');
      if (bundle) {
        bundles.push(bundle);
      }
    });

    return bundles;
  }

  /**
   * Group polyfills by priority
   */
  private groupByPriority(polyfills: Array<{name: string, config: OptimizedPolyfillConfig}>) {
    return polyfills.reduce((groups, polyfill) => {
      const priority = polyfill.config.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(polyfill);
      return groups;
    }, {} as Record<string, Array<{name: string, config: OptimizedPolyfillConfig}>>);
  }

  /**
   * Create a single optimized bundle
   */
  private createSingleBundle(
    polyfills: Array<{name: string, config: OptimizedPolyfillConfig}>, 
    priority: 'high' | 'medium' | 'low'
  ): PolyfillBundle | null {
    if (polyfills.length === 0) return null;

    const polyfillNames = polyfills.map(p => p.name);
    const totalSize = polyfills.reduce((sum, p) => sum + p.config.size, 0);

    // If bundle is too large, split it
    if (totalSize > this.maxBundleSize) {
      return this.createSplitBundle(polyfills, priority);
    }

    // Create combined URL for multiple polyfills
    const features = polyfillNames.join(',');
    const url = `https://polyfill.io/v3/polyfill.min.js?features=${features}&flags=gated`;

    return {
      name: `${priority}-priority-bundle`,
      polyfills: polyfillNames,
      url,
      size: totalSize,
      priority
    };
  }

  /**
   * Create split bundle when size exceeds limit
   */
  private createSplitBundle(
    polyfills: Array<{name: string, config: OptimizedPolyfillConfig}>, 
    priority: 'high' | 'medium' | 'low'
  ): PolyfillBundle {
    // Take only the most critical polyfills that fit within size limit
    let currentSize = 0;
    const selectedPolyfills: string[] = [];

    for (const polyfill of polyfills) {
      if (currentSize + polyfill.config.size <= this.maxBundleSize) {
        selectedPolyfills.push(polyfill.name);
        currentSize += polyfill.config.size;
      } else {
        break;
      }
    }

    const features = selectedPolyfills.join(',');
    const url = `https://polyfill.io/v3/polyfill.min.js?features=${features}&flags=gated`;

    return {
      name: `${priority}-priority-bundle-optimized`,
      polyfills: selectedPolyfills,
      url,
      size: currentSize,
      priority
    };
  }

  /**
   * Generate minimal polyfill configuration for specific browser
   */
  generateMinimalConfig(browserInfo: BrowserInfo): Partial<PolyfillConfig> {
    const requiredPolyfills = this.getRequiredPolyfills(browserInfo);
    const config: Partial<PolyfillConfig> = {};

    requiredPolyfills.forEach(({ name, config: polyfillConfig }) => {
      (config as any)[name] = {
        enabled: true,
        url: polyfillConfig.url,
        condition: polyfillConfig.condition
      };
    });

    return config;
  }

  /**
   * Calculate total bundle size for browser
   */
  calculateBundleSize(browserInfo: BrowserInfo): number {
    const requiredPolyfills = this.getRequiredPolyfills(browserInfo);
    return requiredPolyfills.reduce((total, { config }) => total + config.size, 0);
  }

  /**
   * Get polyfill loading strategy based on browser and connection
   */
  getLoadingStrategy(browserInfo: BrowserInfo, connectionType?: string): 'eager' | 'lazy' | 'critical-only' {
    const bundleSize = this.calculateBundleSize(browserInfo);
    
    // For slow connections, load only critical polyfills
    if (connectionType === 'slow-2g' || connectionType === '2g') {
      return 'critical-only';
    }
    
    // For small bundles, load eagerly
    if (bundleSize < 5120) { // 5KB
      return 'eager';
    }
    
    // For larger bundles, load lazily
    return 'lazy';
  }

  /**
   * Generate preload hints for polyfills
   */
  generatePreloadHints(browserInfo: BrowserInfo): string[] {
    const bundles = this.generateOptimizedBundles(browserInfo);
    const highPriorityBundles = bundles.filter(b => b.priority === 'high');
    
    return highPriorityBundles.map(bundle => 
      `<link rel="preload" href="${bundle.url}" as="script" crossorigin="anonymous">`
    );
  }
}

// Export singleton instance
export const polyfillBundleOptimizer = new PolyfillBundleOptimizer();

/**
 * Utility function to get optimized polyfill configuration
 */
export function getOptimizedPolyfillConfig(browserInfo?: BrowserInfo): Partial<PolyfillConfig> {
  const browser = browserInfo || browserDetectionService.getBrowserInfo();
  return polyfillBundleOptimizer.generateMinimalConfig(browser);
}

/**
 * Utility function to get polyfill bundles for current browser
 */
export function getPolyfillBundles(browserInfo?: BrowserInfo): PolyfillBundle[] {
  const browser = browserInfo || browserDetectionService.getBrowserInfo();
  return polyfillBundleOptimizer.generateOptimizedBundles(browser);
}