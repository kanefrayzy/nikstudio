/**
 * Browser Detection and Feature Detection System
 * Provides comprehensive browser identification and feature support detection
 */

import React from 'react';

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  version: number;
  isSupported: boolean;
  features: {
    fetch: boolean;
    promises: boolean;
    asyncAwait: boolean;
    cssGrid: boolean;
    cssFlexbox: boolean;
    customProperties: boolean;
    intersectionObserver: boolean;
    webp: boolean;
    webm: boolean;
    mp4: boolean;
    fileApi: boolean;
    formData: boolean;
    customEvent: boolean;
    objectAssign: boolean;
  };
}

export interface BrowserDetectionService {
  getBrowserInfo(): BrowserInfo;
  supportsFeature(feature: string): boolean;
  requiresPolyfill(feature: string): boolean;
}

/**
 * Detects browser type and version from user agent string
 */
function detectBrowser(): { name: BrowserInfo['name']; version: number } {
  if (typeof window === 'undefined') {
    return { name: 'unknown', version: 0 };
  }

  const userAgent = window.navigator.userAgent;
  
  // Edge detection (must come before Chrome as Edge includes Chrome in UA)
  if (userAgent.includes('Edg/')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return {
      name: 'edge',
      version: match ? parseInt(match[1], 10) : 0
    };
  }
  
  // Chrome detection
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return {
      name: 'chrome',
      version: match ? parseInt(match[1], 10) : 0
    };
  }
  
  // Firefox detection
  if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return {
      name: 'firefox',
      version: match ? parseInt(match[1], 10) : 0
    };
  }
  
  // Safari detection
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return {
      name: 'safari',
      version: match ? parseInt(match[1], 10) : 0
    };
  }
  
  return { name: 'unknown', version: 0 };
}

/**
 * Determines if browser version is supported based on compatibility matrix
 */
function isBrowserSupported(name: BrowserInfo['name'], version: number): boolean {
  const supportMatrix = {
    chrome: 80,   // Chrome 80+
    firefox: 78,  // Firefox 78+
    safari: 12,   // Safari 12+
    edge: 79,     // Edge 79+
    unknown: Infinity // Unknown browsers are never supported
  };
  
  return version >= supportMatrix[name];
}

/**
 * Detects JavaScript feature support
 */
function detectJavaScriptFeatures() {
  if (typeof window === 'undefined') {
    return {
      fetch: false,
      promises: false,
      asyncAwait: false,
      intersectionObserver: false,
      fileApi: false,
      formData: false,
      customEvent: false,
      objectAssign: false
    };
  }

  return {
    fetch: typeof window.fetch === 'function',
    promises: typeof Promise !== 'undefined',
    asyncAwait: (function() {
      try {
        // Check if async/await syntax is supported
        const AsyncFunction = (async function(){}).constructor;
        return typeof AsyncFunction === 'function';
      } catch {
        return false;
      }
    })(),
    intersectionObserver: 'IntersectionObserver' in window,
    fileApi: 'File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window,
    formData: 'FormData' in window,
    customEvent: 'CustomEvent' in window,
    objectAssign: typeof Object.assign === 'function'
  };
}

/**
 * Detects CSS feature support using @supports queries
 */
function detectCSSFeatures() {
  if (typeof window === 'undefined' || !window.CSS || !window.CSS.supports) {
    return {
      cssGrid: false,
      cssFlexbox: false,
      customProperties: false
    };
  }

  return {
    cssGrid: window.CSS.supports('display', 'grid'),
    cssFlexbox: window.CSS.supports('display', 'flex'),
    customProperties: window.CSS.supports('--custom-property', 'value')
  };
}

/**
 * Detects media format support
 */
function detectMediaFormats() {
  if (typeof window === 'undefined') {
    return {
      webp: false,
      webm: false,
      mp4: false
    };
  }

  try {
    const video = document.createElement('video');
    
    return {
      webp: (function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } catch {
          return false;
        }
      })(),
      webm: video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '',
      mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== ''
    };
  } catch {
    return {
      webp: false,
      webm: false,
      mp4: false
    };
  }
}

/**
 * Main browser detection service implementation
 */
class BrowserDetectionServiceImpl implements BrowserDetectionService {
  private browserInfo: BrowserInfo | null = null;

  getBrowserInfo(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo;
    }

    const { name, version } = detectBrowser();
    const jsFeatures = detectJavaScriptFeatures();
    const cssFeatures = detectCSSFeatures();
    const mediaFeatures = detectMediaFormats();

    this.browserInfo = {
      name,
      version,
      isSupported: isBrowserSupported(name, version),
      features: {
        ...jsFeatures,
        ...cssFeatures,
        ...mediaFeatures
      }
    };

    return this.browserInfo;
  }

  supportsFeature(feature: string): boolean {
    const browserInfo = this.getBrowserInfo();
    return (browserInfo.features as any)[feature] === true;
  }

  requiresPolyfill(feature: string): boolean {
    return !this.supportsFeature(feature);
  }
}

// Export singleton instance
export const browserDetectionService = new BrowserDetectionServiceImpl();

/**
 * Utility functions for common feature checks
 */
export const featureDetection = {
  /**
   * Check if modern JavaScript features are supported
   */
  supportsModernJS(): boolean {
    const info = browserDetectionService.getBrowserInfo();
    return info.features.fetch && 
           info.features.promises && 
           info.features.asyncAwait;
  },

  /**
   * Check if modern CSS features are supported
   */
  supportsModernCSS(): boolean {
    const info = browserDetectionService.getBrowserInfo();
    return info.features.cssGrid && 
           info.features.cssFlexbox && 
           info.features.customProperties;
  },

  /**
   * Check if file upload features are supported
   */
  supportsFileUpload(): boolean {
    const info = browserDetectionService.getBrowserInfo();
    return info.features.fileApi && info.features.formData;
  },

  /**
   * Check if modern media formats are supported
   */
  supportsModernMedia(): boolean {
    const info = browserDetectionService.getBrowserInfo();
    return info.features.webp && info.features.webm;
  },

  /**
   * Get list of features that require polyfills
   */
  getRequiredPolyfills(): string[] {
    const info = browserDetectionService.getBrowserInfo();
    const polyfills: string[] = [];

    if (!info.features.fetch) polyfills.push('fetch');
    if (!info.features.promises) polyfills.push('promises');
    if (!info.features.intersectionObserver) polyfills.push('intersectionObserver');
    if (!info.features.customEvent) polyfills.push('customEvent');
    if (!info.features.objectAssign) polyfills.push('objectAssign');

    return polyfills;
  }
};

/**
 * Hook for React components to access browser information
 */
export function useBrowserDetection() {
  const [browserInfo, setBrowserInfo] = React.useState<BrowserInfo | null>(null);

  React.useEffect(() => {
    setBrowserInfo(browserDetectionService.getBrowserInfo());
  }, []);

  return {
    browserInfo,
    supportsFeature: browserDetectionService.supportsFeature.bind(browserDetectionService),
    requiresPolyfill: browserDetectionService.requiresPolyfill.bind(browserDetectionService),
    ...featureDetection
  };
}