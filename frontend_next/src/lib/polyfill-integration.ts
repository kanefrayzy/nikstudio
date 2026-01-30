/**
 * Polyfill Integration Utilities
 * Provides easy integration of polyfills into Next.js application
 */

import { initializePolyfills, PolyfillConfig, PolyfillLoadResult } from './polyfill-manager';
import { browserDetectionService } from './browser-detection';

/**
 * Application-specific polyfill configuration
 */
export const APP_POLYFILL_CONFIG: Partial<PolyfillConfig> = {
  fetch: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=fetch',
    condition: (browser) => !browser.features.fetch
  },
  promises: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=Promise',
    condition: (browser) => !browser.features.promises
  },
  intersectionObserver: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver',
    condition: (browser) => !browser.features.intersectionObserver
  },
  customEvent: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=CustomEvent',
    condition: (browser) => !browser.features.customEvent
  },
  objectAssign: {
    enabled: true,
    url: 'https://polyfill.io/v3/polyfill.min.js?features=Object.assign',
    condition: (browser) => !browser.features.objectAssign
  }
};

/**
 * Initialize polyfills for the entire application
 */
export async function initializeAppPolyfills(): Promise<PolyfillLoadResult[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  console.log('Initializing application polyfills...');
  
  const browserInfo = browserDetectionService.getBrowserInfo();
  console.log('Browser detected:', {
    name: browserInfo.name,
    version: browserInfo.version,
    isSupported: browserInfo.isSupported
  });

  try {
    const results = await initializePolyfills(APP_POLYFILL_CONFIG);
    
    // Log polyfill loading results
    const loaded = results.filter(r => r.loaded);
    const failed = results.filter(r => !r.loaded);
    const withFallbacks = results.filter(r => r.fallbackApplied);

    if (loaded.length > 0) {
      console.log(`✅ Polyfills loaded: ${loaded.map(r => r.name).join(', ')}`);
    }

    if (withFallbacks.length > 0) {
      console.log(`⚠️ Fallback polyfills used: ${withFallbacks.map(r => r.name).join(', ')}`);
    }

    if (failed.length > 0) {
      console.warn(`❌ Failed to load polyfills: ${failed.map(r => r.name).join(', ')}`);
      failed.forEach(result => {
        if (result.error) {
          console.error(`Error loading ${result.name}:`, result.error.message);
        }
      });
    }

    // Report compatibility status
    reportCompatibilityStatus(browserInfo, results);

    return results;
  } catch (error) {
    console.error('Failed to initialize application polyfills:', error);
    return [];
  }
}

/**
 * Report browser compatibility status for monitoring
 */
function reportCompatibilityStatus(browserInfo: any, polyfillResults: PolyfillLoadResult[]): void {
  const compatibilityData = {
    browser: {
      name: browserInfo.name,
      version: browserInfo.version,
      isSupported: browserInfo.isSupported
    },
    polyfills: {
      total: polyfillResults.length,
      loaded: polyfillResults.filter(r => r.loaded).length,
      failed: polyfillResults.filter(r => !r.loaded).length,
      withFallbacks: polyfillResults.filter(r => r.fallbackApplied).length
    },
    features: browserInfo.features,
    timestamp: new Date().toISOString()
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('Browser Compatibility Report:', compatibilityData);
  }

  // In production, you might want to send this to analytics
  // Example: analytics.track('browser_compatibility', compatibilityData);
}

/**
 * Check if critical polyfills are loaded and working
 */
export function validateCriticalPolyfills(): boolean {
  const criticalFeatures = [
    { name: 'fetch', check: () => typeof window.fetch === 'function' },
    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
    { name: 'Object.assign', check: () => typeof Object.assign === 'function' }
  ];

  const failedFeatures = criticalFeatures.filter(feature => {
    try {
      return !feature.check();
    } catch {
      return true;
    }
  });

  if (failedFeatures.length > 0) {
    console.error('Critical polyfills missing:', failedFeatures.map(f => f.name));
    return false;
  }

  return true;
}

/**
 * Get polyfill recommendations based on browser
 */
export function getPolyfillRecommendations(): {
  required: string[];
  recommended: string[];
  optional: string[];
} {
  const browserInfo = browserDetectionService.getBrowserInfo();
  const required: string[] = [];
  const recommended: string[] = [];
  const optional: string[] = [];

  // Required polyfills for basic functionality
  if (!browserInfo.features.fetch) required.push('fetch');
  if (!browserInfo.features.promises) required.push('promises');
  if (!browserInfo.features.objectAssign) required.push('objectAssign');

  // Recommended polyfills for enhanced functionality
  if (!browserInfo.features.intersectionObserver) recommended.push('intersectionObserver');
  if (!browserInfo.features.customEvent) recommended.push('customEvent');

  // Optional polyfills based on browser support level
  if (!browserInfo.isSupported) {
    optional.push('es6-collections', 'array-includes', 'string-includes');
  }

  return { required, recommended, optional };
}

/**
 * Create a polyfill configuration for specific features
 */
export function createFeaturePolyfillConfig(features: string[]): Partial<PolyfillConfig> {
  const config: Partial<PolyfillConfig> = {};

  features.forEach(feature => {
    switch (feature) {
      case 'fetch':
        config.fetch = APP_POLYFILL_CONFIG.fetch;
        break;
      case 'promises':
        config.promises = APP_POLYFILL_CONFIG.promises;
        break;
      case 'intersectionObserver':
        config.intersectionObserver = APP_POLYFILL_CONFIG.intersectionObserver;
        break;
      case 'customEvent':
        config.customEvent = APP_POLYFILL_CONFIG.customEvent;
        break;
      case 'objectAssign':
        config.objectAssign = APP_POLYFILL_CONFIG.objectAssign;
        break;
    }
  });

  return config;
}

/**
 * Utility to conditionally load polyfills for specific components
 */
export async function loadPolyfillsForComponent(requiredFeatures: string[]): Promise<boolean> {
  const browserInfo = browserDetectionService.getBrowserInfo();
  const missingFeatures = requiredFeatures.filter(feature => {
    return !(browserInfo.features as any)[feature];
  });

  if (missingFeatures.length === 0) {
    return true; // All features supported
  }

  try {
    const config = createFeaturePolyfillConfig(missingFeatures);
    const results = await initializePolyfills(config);
    
    const allLoaded = results.every(r => r.loaded);
    
    if (!allLoaded) {
      console.warn(`Some polyfills failed to load for component features: ${missingFeatures.join(', ')}`);
    }
    
    return allLoaded;
  } catch (error) {
    console.error('Failed to load component polyfills:', error);
    return false;
  }
}

/**
 * Error boundary helper for polyfill-related errors
 */
export class PolyfillError extends Error {
  constructor(
    message: string,
    public polyfillName: string,
    public browserInfo: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PolyfillError';
  }
}

/**
 * Handle polyfill loading errors with appropriate fallbacks
 */
export function handlePolyfillError(error: PolyfillError): void {
  console.error(`Polyfill error for ${error.polyfillName}:`, error.message);
  
  // Report error to monitoring service
  if (typeof window !== 'undefined' && (window as any).reportError) {
    (window as any).reportError(error);
  }
  
  // Show user-friendly message for critical polyfills
  const criticalPolyfills = ['fetch', 'promises'];
  if (criticalPolyfills.includes(error.polyfillName)) {
    console.warn(
      `Critical polyfill ${error.polyfillName} failed to load. ` +
      'Some features may not work properly in this browser.'
    );
  }
}

/**
 * Performance monitoring for polyfill loading
 */
export function measurePolyfillPerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  return operation().then(
    result => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Polyfill operation "${operationName}" took ${duration.toFixed(2)}ms`);
      
      // Report performance metrics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'polyfill_performance', {
          operation: operationName,
          duration: Math.round(duration)
        });
      }
      
      return result;
    },
    error => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Polyfill operation "${operationName}" failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  );
}