/**
 * Simple Cross-Browser Compatibility Provider
 * Handles basic polyfills and browser detection
 */

'use client';

import React from 'react';

interface CompatibilityProviderProps {
  children: React.ReactNode;
  enableErrorNotifications?: boolean;
  enablePolyfillStatus?: boolean;
}

/**
 * Simple browser detection
 */
function detectBrowser() {
  if (typeof window === 'undefined') return { name: 'server', version: 0, isModern: true };
  
  const ua = navigator.userAgent;
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const version = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '0');
    return { name: 'Chrome', version, isModern: version >= 80 };
  }
  if (ua.includes('Firefox')) {
    const version = parseInt(ua.match(/Firefox\/(\d+)/)?.[1] || '0');
    return { name: 'Firefox', version, isModern: version >= 78 };
  }
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const version = parseInt(ua.match(/Version\/(\d+)/)?.[1] || '0');
    return { name: 'Safari', version, isModern: version >= 13 };
  }
  if (ua.includes('Edg')) {
    const version = parseInt(ua.match(/Edg\/(\d+)/)?.[1] || '0');
    return { name: 'Edge', version, isModern: version >= 80 };
  }
  
  return { name: 'Unknown', version: 0, isModern: false };
}

/**
 * Apply basic polyfills
 */
function applyBasicPolyfills() {
  // Object.assign polyfill
  if (!Object.assign) {
    Object.assign = function(target: any, ...sources: any[]) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
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

  // Array.from polyfill
  if (!Array.from) {
    Array.from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
      const items = Object(arrayLike);
      const len = parseInt(items.length) || 0;
      const result = new Array(len);
      for (let i = 0; i < len; i++) {
        result[i] = mapFn ? mapFn.call(thisArg, items[i], i) : items[i];
      }
      return result;
    };
  }

  // Array.includes polyfill
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement: any, fromIndex?: number) {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) return false;
      const n = parseInt(String(fromIndex || 0)) || 0;
      let k = n >= 0 ? n : Math.max(len + n, 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    };
  }

  // String.includes polyfill
  if (!String.prototype.includes) {
    String.prototype.includes = function(search: string, start?: number) {
      if (typeof start !== 'number') start = 0;
      if (start + search.length > this.length) return false;
      return this.indexOf(search, start) !== -1;
    };
  }

  // CustomEvent polyfill
  if (!window.CustomEvent) {
    window.CustomEvent = function CustomEvent(event: string, params: any = {}) {
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
      return evt;
    } as any;
  }

  // Promise polyfill (basic)
  if (!window.Promise) {
    window.Promise = class SimplePromise<T> {
      private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
      private value: any;
      private handlers: any[] = [];

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
          this.handlers.forEach(handler => handler.onFulfilled && handler.onFulfilled(value));
        }
      }

      private reject(reason: any) {
        if (this.state === 'pending') {
          this.state = 'rejected';
          this.value = reason;
          this.handlers.forEach(handler => handler.onRejected && handler.onRejected(reason));
        }
      }

      then(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any) {
        return new SimplePromise((resolve, reject) => {
          if (this.state === 'fulfilled') {
            try {
              resolve(onFulfilled ? onFulfilled(this.value) : this.value);
            } catch (error) {
              reject(error);
            }
          } else if (this.state === 'rejected') {
            try {
              resolve(onRejected ? onRejected(this.value) : this.value);
            } catch (error) {
              reject(error);
            }
          } else {
            this.handlers.push({ onFulfilled, onRejected, resolve, reject });
          }
        });
      }

      catch(onRejected: (reason: any) => any) {
        return this.then(undefined, onRejected);
      }

      static resolve<T>(value: T) {
        return new SimplePromise<T>(resolve => resolve(value));
      }

      static reject<T>(reason: any) {
        return new SimplePromise<T>((_, reject) => reject(reason));
      }
    } as any;
  }

  // Fetch polyfill (basic)
  if (!window.fetch) {
    window.fetch = function(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        const urlString = typeof url === 'string' ? url : url.toString();
        
        xhr.open(method, urlString);
        
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
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            text: () => Promise.resolve(xhr.responseText),
            blob: () => Promise.resolve(new Blob([xhr.response])),
            headers: new Map()
          } as unknown as Response;
          
          resolve(response);
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(options.body as string);
      });
    };
  }
}

/**
 * Apply CSS fallbacks
 */
function applyCSSFallbacks() {
  const style = document.createElement('style');
  style.textContent = `
    /* CSS Grid fallback */
    @supports not (display: grid) {
      .grid { display: flex; flex-wrap: wrap; }
      .grid > * { flex: 1; min-width: 300px; }
    }
    
    /* Custom properties fallback */
    @supports not (color: var(--primary)) {
      :root {
        --primary-color: #3b82f6;
        --secondary-color: #64748b;
        --success-color: #10b981;
        --error-color: #ef4444;
        --warning-color: #f59e0b;
      }
    }
    
    /* Flexbox gap fallback */
    @supports not (gap: 1rem) {
      .flex-gap > * + * { margin-left: 1rem; }
      .flex-col-gap > * + * { margin-top: 1rem; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Simple Compatibility Provider Component
 */
export function CompatibilityProvider({
  children,
  enableErrorNotifications = true,
  enablePolyfillStatus = false
}: CompatibilityProviderProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [browserInfo, setBrowserInfo] = React.useState({ name: 'server', version: 0, isModern: true });

  React.useEffect(() => {
    setIsClient(true);
    
    // Detect browser
    const browser = detectBrowser();
    setBrowserInfo(browser);
    
    // Apply polyfills
    applyBasicPolyfills();
    
    // Apply CSS fallbacks
    applyCSSFallbacks();
    
    // Add browser-specific classes to body
    document.body.classList.add(`browser-${browser.name.toLowerCase()}`);
    document.body.classList.add(`browser-version-${browser.version}`);
    if (!browser.isModern) {
      document.body.classList.add('browser-legacy');
    }
    
    // Show warning for unsupported browsers
    if (!browser.isModern && enableErrorNotifications) {
      console.warn(`Браузер ${browser.name} ${browser.version} может не поддерживать все функции сайта`);
      
      // Show user notification after a delay
      setTimeout(() => {
        if (document.getElementById('browser-warning')) return; // Don't show multiple warnings
        
        const warning = document.createElement('div');
        warning.id = 'browser-warning';
        warning.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            max-width: 400px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #f59e0b; margin-right: 8px; font-size: 18px;">⚠️</span>
              <strong style="color: #92400e;">Устаревший браузер</strong>
            </div>
            <p style="color: #92400e; margin: 0 0 12px 0; font-size: 14px;">
              Некоторые функции могут работать некорректно. Рекомендуем обновить браузер.
            </p>
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: #f59e0b;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">
              Понятно
            </button>
          </div>
        `;
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (warning.parentElement) {
            warning.parentElement.removeChild(warning);
          }
        }, 10000);
      }, 2000);
    }
    
    console.log('Cross-browser compatibility initialized:', {
      browser: browser.name,
      version: browser.version,
      isModern: browser.isModern,
      features: {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        cssGrid: typeof CSS !== 'undefined' && CSS.supports && CSS.supports('display', 'grid'),
        customEvent: typeof CustomEvent !== 'undefined'
      }
    });
  }, [enableErrorNotifications]);

  return (
    <>
      {children}
      <div suppressHydrationWarning>
        {isClient && (
          <ClientOnlyComponents 
            browserInfo={browserInfo}
            enablePolyfillStatus={enablePolyfillStatus}
            enableErrorNotifications={enableErrorNotifications}
          />
        )}
      </div>
    </>
  );
}

/**
 * Client-only components to avoid hydration issues
 */
function ClientOnlyComponents({
  browserInfo,
  enablePolyfillStatus,
  enableErrorNotifications
}: {
  browserInfo: { name: string; version: number; isModern: boolean };
  enablePolyfillStatus: boolean;
  enableErrorNotifications: boolean;
}) {
  const [showBrowserStatus, setShowBrowserStatus] = React.useState(true);
  const [showLegacyWarning, setShowLegacyWarning] = React.useState(true);

  // Hide browser status after 60 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowBrowserStatus(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Hide legacy warning after 60 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowLegacyWarning(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showBrowserStatus && enablePolyfillStatus && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 transition-opacity duration-500 hidden">
          <div className={`text-white px-3 py-2 rounded-md text-sm ${
            browserInfo.isModern ? 'bg-green-600' : 'bg-yellow-600'
          }`}>
            {browserInfo.name} {browserInfo.version} - {browserInfo.isModern ? 'Поддерживается' : 'Ограниченная поддержка'}
            <button 
              onClick={() => setShowBrowserStatus(false)}
              className="ml-2 text-white hover:text-gray-200 text-xs"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {showLegacyWarning && !browserInfo.isModern && enableErrorNotifications && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Устаревший браузер
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Некоторые функции могут работать некорректно. Рекомендуем обновить браузер.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLegacyWarning(false)}
                className="ml-2 text-yellow-600 hover:text-yellow-800 text-sm"
                title="Закрыть"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Hook for basic compatibility utilities (simplified)
 */
export function useCompatibility() {
  return {
    status: null,
    issues: [],
    reportIssue: async () => {},
    getErrorStats: () => ({}),
    getDegradationSummary: () => ({}),
    browserInfo: { name: 'unknown', version: 0, isSupported: true }
  };
}