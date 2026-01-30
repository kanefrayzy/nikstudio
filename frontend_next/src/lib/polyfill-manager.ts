/**
 * Polyfill Management System
 * Handles dynamic loading of polyfills based on browser feature detection
 */

import React from 'react';
import { browserDetectionService, BrowserInfo } from './browser-detection';

export interface PolyfillConfig {
  fetch: {
    enabled: boolean;
    url: string;
    condition: (browser: BrowserInfo) => boolean;
  };
  promises: {
    enabled: boolean;
    url: string;
    condition: (browser: BrowserInfo) => boolean;
  };
  intersectionObserver: {
    enabled: boolean;
    url: string;
    condition: (browser: BrowserInfo) => boolean;
  };
  customEvent: {
    enabled: boolean;
    url: string;
    condition: (browser: BrowserInfo) => boolean;
  };
  objectAssign: {
    enabled: boolean;
    url: string;
    condition: (browser: BrowserInfo) => boolean;
  };
}

export interface PolyfillLoadResult {
  name: string;
  loaded: boolean;
  error?: Error;
  fallbackApplied?: boolean;
}

export interface PolyfillManager {
  loadPolyfills(config?: Partial<PolyfillConfig>): Promise<PolyfillLoadResult[]>;
  isPolyfillLoaded(name: string): boolean;
  getLoadedPolyfills(): string[];
  clearCache(): void;
}

/**
 * Default polyfill configuration
 */
const DEFAULT_POLYFILL_CONFIG: PolyfillConfig = {
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
 * Local fallback polyfills for when CDN fails
 */
const FALLBACK_POLYFILLS = {
  fetch: () => {
    // Simple fetch polyfill using XMLHttpRequest
    if (!window.fetch) {
      (window as any).fetch = function(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const method = options.method || 'GET';
          
          xhr.open(method, url.toString());
          
          // Set headers
          if (options.headers) {
            const headers = options.headers as Record<string, string>;
            Object.keys(headers).forEach(key => {
              xhr.setRequestHeader(key, headers[key]);
            });
          }
          
          xhr.onload = () => {
            const response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              redirected: false,
              type: 'basic' as ResponseType,
              url: typeof url === 'string' ? url : url.toString(),
              body: null,
              bodyUsed: false,
              headers: new Headers(),
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText),
              blob: () => Promise.resolve(new Blob([xhr.response])),
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
              formData: () => Promise.resolve(new FormData()),
              clone: () => response,
              bytes: () => Promise.resolve(new Uint8Array())
            } as unknown as Response;
            
            resolve(response);
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options.body as string);
        });
      };
    }
  },
  
  promises: () => {
    // Basic Promise polyfill
    if (!window.Promise) {
      window.Promise = class SimplePromise<T> {
        private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
        private value: T | any;
        private handlers: Array<{
          onFulfilled?: (value: T) => any;
          onRejected?: (reason: any) => any;
          resolve: (value: any) => void;
          reject: (reason: any) => void;
        }> = [];

        constructor(executor: (resolve: (value: T) => void, reject: (reason: any) => void) => void) {
          try {
            executor(this.resolve.bind(this), this.reject.bind(this));
          } catch (error) {
            this.reject(error);
          }
        }

        private resolve(value: T) {
          if (this.state === 'pending') {
            this.state = 'fulfilled';
            this.value = value;
            this.handlers.forEach(handler => {
              if (handler.onFulfilled) {
                try {
                  const result = handler.onFulfilled(value);
                  handler.resolve(result);
                } catch (error) {
                  handler.reject(error);
                }
              } else {
                handler.resolve(value);
              }
            });
          }
        }

        private reject(reason: any) {
          if (this.state === 'pending') {
            this.state = 'rejected';
            this.value = reason;
            this.handlers.forEach(handler => {
              if (handler.onRejected) {
                try {
                  const result = handler.onRejected(reason);
                  handler.resolve(result);
                } catch (error) {
                  handler.reject(error);
                }
              } else {
                handler.reject(reason);
              }
            });
          }
        }

        then<TResult1 = T, TResult2 = never>(
          onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
          onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
        ): Promise<TResult1 | TResult2> {
          return new SimplePromise<TResult1 | TResult2>((resolve, reject) => {
            if (this.state === 'fulfilled') {
              if (onFulfilled) {
                try {
                  const result = onFulfilled(this.value);
                  resolve(result as TResult1 | TResult2);
                } catch (error) {
                  reject(error);
                }
              } else {
                resolve(this.value as TResult1 | TResult2);
              }
            } else if (this.state === 'rejected') {
              if (onRejected) {
                try {
                  const result = onRejected(this.value);
                  resolve(result as TResult1 | TResult2);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(this.value);
              }
            } else {
              this.handlers.push({ 
                onFulfilled: onFulfilled as any, 
                onRejected: onRejected as any, 
                resolve, 
                reject 
              });
            }
          });
        }

        catch<TResult = never>(onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<T | TResult> {
          return this.then(undefined, onRejected);
        }

        finally(onFinally?: () => void): Promise<T> {
          return this.then(
            (value) => {
              if (onFinally) onFinally();
              return value;
            },
            (reason) => {
              if (onFinally) onFinally();
              throw reason;
            }
          );
        }

        get [Symbol.toStringTag]() {
          return 'Promise';
        }

        static resolve<T>(value: T): Promise<T> {
          return new SimplePromise(resolve => resolve(value));
        }

        static reject<T>(reason: any): Promise<T> {
          return new SimplePromise((_, reject) => reject(reason));
        }
      } as any;
    }
  },
  
  intersectionObserver: () => {
    // Basic IntersectionObserver polyfill
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class {
        private callback: IntersectionObserverCallback;
        private elements: Set<Element> = new Set();
        
        root: Element | Document | null = null;
        rootMargin: string = '0px';
        thresholds: ReadonlyArray<number> = [0];

        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          this.callback = callback;
          if (options) {
            this.root = options.root || null;
            this.rootMargin = options.rootMargin || '0px';
            this.thresholds = options.threshold ? 
              (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : 
              [0];
          }
        }

        observe(element: Element) {
          this.elements.add(element);
          // Trigger callback immediately for fallback behavior
          setTimeout(() => {
            this.callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: element.getBoundingClientRect(),
              rootBounds: null,
              intersectionRect: element.getBoundingClientRect(),
              time: Date.now()
            }], this as any);
          }, 0);
        }

        unobserve(element: Element) {
          this.elements.delete(element);
        }

        disconnect() {
          this.elements.clear();
        }

        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      } as any;
    }
  },
  
  customEvent: () => {
    // CustomEvent polyfill
    if (!window.CustomEvent) {
      window.CustomEvent = function CustomEvent(event: string, params: CustomEventInit = {}) {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
        return evt;
      } as any;
    }
  },
  
  objectAssign: () => {
    // Object.assign polyfill
    if (!Object.assign) {
      Object.assign = function(target: any, ...sources: any[]) {
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }
        
        const to = Object(target);
        
        for (let index = 0; index < sources.length; index++) {
          const nextSource = sources[index];
          
          if (nextSource != null) {
            for (const nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        
        return to;
      };
    }
  }
};

/**
 * Polyfill Manager Implementation
 */
class PolyfillManagerImpl implements PolyfillManager {
  private loadedPolyfills: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<PolyfillLoadResult>> = new Map();

  async loadPolyfills(customConfig?: Partial<PolyfillConfig>): Promise<PolyfillLoadResult[]> {
    const config = { ...DEFAULT_POLYFILL_CONFIG, ...customConfig };
    const browserInfo = browserDetectionService.getBrowserInfo();
    const results: PolyfillLoadResult[] = [];

    // Determine which polyfills are needed
    const polyfillsToLoad = Object.entries(config).filter(([_name, polyfillConfig]) => {
      return polyfillConfig.enabled && polyfillConfig.condition(browserInfo);
    });

    if (polyfillsToLoad.length === 0) {
      console.log('No polyfills required for this browser');
      return results;
    }

    console.log(`Loading polyfills for: ${polyfillsToLoad.map(([name]) => name).join(', ')}`);

    // Load polyfills concurrently
    const loadPromises = polyfillsToLoad.map(([name, polyfillConfig]) => 
      this.loadSinglePolyfill(name, polyfillConfig.url)
    );

    const loadResults = await Promise.allSettled(loadPromises);
    
    loadResults.forEach((result, index) => {
      const [polyfillName] = polyfillsToLoad[index];
      
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          name: polyfillName,
          loaded: false,
          error: result.reason,
          fallbackApplied: false
        });
      }
    });

    return results;
  }

  private async loadSinglePolyfill(name: string, url: string): Promise<PolyfillLoadResult> {
    // Check if already loaded
    if (this.loadedPolyfills.has(name)) {
      return { name, loaded: true };
    }

    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    const loadPromise = this.performPolyfillLoad(name, url);
    this.loadingPromises.set(name, loadPromise);

    try {
      const result = await loadPromise;
      if (result.loaded) {
        this.loadedPolyfills.add(name);
      }
      return result;
    } finally {
      this.loadingPromises.delete(name);
    }
  }

  private async performPolyfillLoad(name: string, url: string): Promise<PolyfillLoadResult> {
    try {
      // Try loading from CDN first
      await this.loadScriptFromUrl(url);
      
      // Verify the polyfill was loaded successfully
      if (this.verifyPolyfillLoaded(name)) {
        console.log(`Successfully loaded ${name} polyfill from CDN`);
        return { name, loaded: true };
      } else {
        throw new Error(`Polyfill ${name} loaded but verification failed`);
      }
    } catch (error) {
      console.warn(`Failed to load ${name} polyfill from CDN:`, error);
      
      // Try fallback polyfill
      try {
        this.applyFallbackPolyfill(name);
        
        if (this.verifyPolyfillLoaded(name)) {
          console.log(`Successfully applied fallback polyfill for ${name}`);
          return { name, loaded: true, fallbackApplied: true };
        } else {
          throw new Error(`Fallback polyfill for ${name} failed verification`);
        }
      } catch (fallbackError) {
        console.error(`Failed to apply fallback polyfill for ${name}:`, fallbackError);
        return {
          name,
          loaded: false,
          error: error instanceof Error ? error : new Error(String(error)),
          fallbackApplied: false
        };
      }
    }
  }

  private loadScriptFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        document.head.removeChild(script);
        resolve();
      };
      
      script.onerror = () => {
        document.head.removeChild(script);
        reject(new Error(`Failed to load script from ${url}`));
      };
      
      // Set timeout for loading
      const timeout = setTimeout(() => {
        document.head.removeChild(script);
        reject(new Error(`Timeout loading script from ${url}`));
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        clearTimeout(timeout);
        document.head.removeChild(script);
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }

  private applyFallbackPolyfill(name: string): void {
    const fallback = FALLBACK_POLYFILLS[name as keyof typeof FALLBACK_POLYFILLS];
    if (fallback) {
      fallback();
    } else {
      throw new Error(`No fallback polyfill available for ${name}`);
    }
  }

  private verifyPolyfillLoaded(name: string): boolean {
    switch (name) {
      case 'fetch':
        return typeof window.fetch === 'function';
      case 'promises':
        return typeof Promise !== 'undefined';
      case 'intersectionObserver':
        return 'IntersectionObserver' in window;
      case 'customEvent':
        return 'CustomEvent' in window;
      case 'objectAssign':
        return typeof Object.assign === 'function';
      default:
        return false;
    }
  }

  isPolyfillLoaded(name: string): boolean {
    return this.loadedPolyfills.has(name);
  }

  getLoadedPolyfills(): string[] {
    return Array.from(this.loadedPolyfills);
  }

  clearCache(): void {
    this.loadedPolyfills.clear();
    this.loadingPromises.clear();
  }
}

// Export singleton instance
export const polyfillManager = new PolyfillManagerImpl();

/**
 * Utility function to initialize polyfills based on browser detection
 */
export async function initializePolyfills(customConfig?: Partial<PolyfillConfig>): Promise<PolyfillLoadResult[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const results = await polyfillManager.loadPolyfills(customConfig);
    
    // Log results
    const loaded = results.filter(r => r.loaded);
    const failed = results.filter(r => !r.loaded);
    
    if (loaded.length > 0) {
      console.log(`Polyfills loaded successfully: ${loaded.map(r => r.name).join(', ')}`);
    }
    
    if (failed.length > 0) {
      console.warn(`Failed to load polyfills: ${failed.map(r => r.name).join(', ')}`);
      failed.forEach(result => {
        if (result.error) {
          console.error(`Error loading ${result.name}:`, result.error);
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Failed to initialize polyfills:', error);
    return [];
  }
}

/**
 * React hook for polyfill management
 */
export function usePolyfills(customConfig?: Partial<PolyfillConfig>) {
  const [polyfillResults, setPolyfillResults] = React.useState<PolyfillLoadResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadPolyfills = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const results = await initializePolyfills(customConfig);
        
        if (mounted) {
          setPolyfillResults(results);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPolyfills();

    return () => {
      mounted = false;
    };
  }, [customConfig]);

  return {
    polyfillResults,
    isLoading,
    error,
    loadedPolyfills: polyfillManager.getLoadedPolyfills(),
    isPolyfillLoaded: polyfillManager.isPolyfillLoaded.bind(polyfillManager)
  };
}