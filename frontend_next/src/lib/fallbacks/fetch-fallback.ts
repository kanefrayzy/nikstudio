/**
 * Fetch API Fallback Implementation
 * Provides XMLHttpRequest-based fetch polyfill for older browsers
 */

export interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Map<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  clone(): FetchResponse;
}

/**
 * Apply fetch fallback using XMLHttpRequest
 */
export function applyFetchFallback(): void {
  if (typeof window === 'undefined' || 'fetch' in window) {
    return;
  }

  (window as any).fetch = function(
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init.method || 'GET';
      
      xhr.open(method, url, true);
      
      // Set headers
      if (init.headers) {
        const headers = init.headers as Record<string, string>;
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }
      
      // Handle credentials
      if (init.credentials === 'include') {
        xhr.withCredentials = true;
      }
      
      // Set timeout if specified
      if (init.signal) {
        const abortController = init.signal as AbortSignal;
        if (abortController.aborted) {
          reject(new Error('Request aborted'));
          return;
        }
        
        abortController.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Request aborted'));
        });
      }
      
      xhr.onload = () => {
        const headers = new Map<string, string>();
        
        // Parse response headers
        const headerString = xhr.getAllResponseHeaders();
        if (headerString) {
          headerString.split('\r\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              headers.set(parts[0].toLowerCase(), parts[1]);
            }
          });
        }
        
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {
            get: (name: string) => headers.get(name.toLowerCase()) || null,
            has: (name: string) => headers.has(name.toLowerCase()),
            forEach: (callback: (value: string, key: string) => void) => {
              headers.forEach(callback);
            }
          } as Headers,
          url: xhr.responseURL || url,
          redirected: xhr.responseURL !== url,
          type: 'basic' as ResponseType,
          bodyUsed: false,
          body: null,
          bytes: () => Promise.resolve(new Uint8Array()),
          formData: () => Promise.resolve(new FormData()),
          
          json: () => {
            try {
              return Promise.resolve(JSON.parse(xhr.responseText));
            } catch {
              return Promise.reject(new Error('Invalid JSON response'));
            }
          },
          
          text: () => Promise.resolve(xhr.responseText),
          
          blob: () => {
            try {
              return Promise.resolve(new Blob([xhr.response]));
            } catch {
              return Promise.reject(new Error('Failed to create blob'));
            }
          },
          
          arrayBuffer: () => {
            try {
              const buffer = new ArrayBuffer(xhr.response.length);
              const view = new Uint8Array(buffer);
              for (let i = 0; i < xhr.response.length; i++) {
                view[i] = xhr.response.charCodeAt(i);
              }
              return Promise.resolve(buffer);
            } catch {
              return Promise.reject(new Error('Failed to create array buffer'));
            }
          },
          
          clone: () => {
            throw new Error('Response cloning not supported in fallback');
          }
        } as unknown as Response;
        
        resolve(response);
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Request timeout'));
      };
      
      // Send request
      try {
        if (init.body) {
          if (init.body instanceof FormData) {
            xhr.send(init.body);
          } else if (typeof init.body === 'string') {
            xhr.send(init.body);
          } else {
            xhr.send(JSON.stringify(init.body));
          }
        } else {
          xhr.send();
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  
  console.log('Fetch fallback applied using XMLHttpRequest');
}

/**
 * Enhanced fetch with retry logic for better reliability
 */
export function createEnhancedFetch(maxRetries = 3, retryDelay = 1000) {
  const originalFetch = window.fetch;
  
  return async function enhancedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await originalFetch(input, init);
        
        // If response is ok or it's a client error (4xx), don't retry
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        // For server errors (5xx), retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError!;
  };
}

/**
 * Check if fetch API is available and working
 */
export function isFetchAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof window.fetch === 'function' &&
           typeof window.Request === 'function' &&
           typeof window.Response === 'function';
  } catch {
    return false;
  }
}

/**
 * Test fetch functionality
 */
export async function testFetch(): Promise<boolean> {
  if (!isFetchAvailable()) {
    return false;
  }
  
  try {
    // Test with a simple request
    const response = await window.fetch('data:text/plain,test', {
      method: 'GET'
    });
    
    const text = await response.text();
    return text === 'test';
  } catch {
    return false;
  }
}