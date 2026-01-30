/**
 * Cross-Browser Utility Functions
 * Helper functions that work consistently across all browsers
 */

/**
 * File validation utilities
 */
export const fileUtils = {
  /**
   * Validate file size with cross-browser support
   */
  validateFileSize: (file: File, maxSizeMB: number): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * Validate file type with cross-browser support
   */
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check MIME type
    if (allowedTypes.some(type => fileType.includes(type))) {
      return true;
    }
    
    // Fallback: check file extension
    const extension = fileName.split('.').pop() || '';
    return allowedTypes.some(type => type.includes(extension));
  },

  /**
   * Get file size in human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Create object URL with fallback
   */
  createObjectURL: (file: File): string => {
    if (typeof window === 'undefined') return '';
    if (window.URL && window.URL.createObjectURL) {
      return window.URL.createObjectURL(file);
    } else if ((window as any).webkitURL) {
      return (window as any).webkitURL.createObjectURL(file);
    }
    // Fallback for very old browsers
    return '';
  },

  /**
   * Revoke object URL with fallback
   */
  revokeObjectURL: (url: string): void => {
    if (typeof window === 'undefined') return;
    if (window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(url);
    } else if ((window as any).webkitURL) {
      (window as any).webkitURL.revokeObjectURL(url);
    }
  }
};

/**
 * DOM utilities with cross-browser support
 */
export const domUtils = {
  /**
   * Add event listener with cross-browser support
   */
  addEventListener: (element: Element, event: string, handler: EventListener): void => {
    if (element.addEventListener) {
      element.addEventListener(event, handler);
    } else if ((element as any).attachEvent) {
      (element as any).attachEvent('on' + event, handler);
    }
  },

  /**
   * Remove event listener with cross-browser support
   */
  removeEventListener: (element: Element, event: string, handler: EventListener): void => {
    if (element.removeEventListener) {
      element.removeEventListener(event, handler);
    } else if ((element as any).detachEvent) {
      (element as any).detachEvent('on' + event, handler);
    }
  },

  /**
   * Get computed style with cross-browser support
   */
  getComputedStyle: (element: Element, property: string): string => {
    if (typeof window === 'undefined') return '';
    if (window.getComputedStyle) {
      return window.getComputedStyle(element).getPropertyValue(property);
    } else if ((element as any).currentStyle) {
      return (element as any).currentStyle[property];
    }
    return '';
  },

  /**
   * Check if element is in viewport
   */
  isInViewport: (element: Element): boolean => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

/**
 * Storage utilities with fallbacks
 */
export const storageUtils = {
  /**
   * Set item in localStorage with fallback
   */
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Fallback to cookie storage
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=86400`;
        return true;
      }
    }
    return false;
  },

  /**
   * Get item from localStorage with fallback
   */
  getItem: (key: string): string | null => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {
      // Fallback to cookie storage
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [cookieKey, cookieValue] = cookie.trim().split('=');
          if (cookieKey === key) {
            return decodeURIComponent(cookieValue);
          }
        }
      }
    }
    return null;
  },

  /**
   * Remove item from localStorage with fallback
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch {
      // Fallback to cookie removal
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        return true;
      }
    }
    return false;
  }
};

/**
 * Network utilities with cross-browser support
 */
export const networkUtils = {
  /**
   * Make HTTP request with fallback to XMLHttpRequest
   */
  request: async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Try fetch first
    if (typeof window !== 'undefined' && 'fetch' in window) {
      return fetch(url, options);
    }

    // Fallback to XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      
      xhr.open(method, url);
      
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
          url: url,
          headers: new Headers(),
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText),
          blob: () => Promise.resolve(new Blob([xhr.response])),
          arrayBuffer: () => Promise.resolve(xhr.response),
          formData: () => Promise.resolve(new FormData()),
          clone: () => response,
          body: null,
          bodyUsed: false
        } as Response;
        
        resolve(response);
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      
      // Set timeout
      xhr.timeout = 30000; // 30 seconds
      
      xhr.send(options.body as string);
    });
  },

  /**
   * Upload file with progress tracking
   */
  uploadFile: (
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = {
            ok: true,
            status: xhr.status,
            statusText: xhr.statusText,
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            text: () => Promise.resolve(xhr.responseText)
          } as Response;
          resolve(response);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      
      xhr.timeout = 300000; // 5 minutes for file uploads
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }
};

/**
 * Media utilities for cross-browser support
 */
export const mediaUtils = {
  /**
   * Check if browser supports video format
   */
  supportsVideoFormat: (format: string): boolean => {
    if (typeof document === 'undefined') return false;
    const video = document.createElement('video');
    return video.canPlayType(format) !== '';
  },

  /**
   * Check if browser supports image format
   */
  supportsImageFormat: (format: string): boolean => {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    try {
      return canvas.toDataURL(format).indexOf(format) > -1;
    } catch {
      return false;
    }
  },

  /**
   * Get video thumbnail
   */
  getVideoThumbnail: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }
      
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
        
        // Cleanup
        fileUtils.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };
      
      video.src = fileUtils.createObjectURL(file);
    });
  }
};

/**
 * Form utilities with cross-browser support
 */
export const formUtils = {
  /**
   * Serialize form data with cross-browser support
   */
  serializeForm: (form: HTMLFormElement): Record<string, any> => {
    const data: Record<string, any> = {};
    const formData = new FormData(form);
    
    // Use FormData.entries() if available
    if (formData.entries) {
      for (const [key, value] of formData.entries()) {
        if (data[key]) {
          // Handle multiple values
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      }
    } else {
      // Fallback for older browsers
      const elements = form.elements;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLInputElement;
        if (element.name && element.value) {
          data[element.name] = element.value;
        }
      }
    }
    
    return data;
  },

  /**
   * Validate form with custom rules
   */
  validateForm: (form: HTMLFormElement, rules: Record<string, (value: any) => boolean>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const data = formUtils.serializeForm(form);
    
    Object.keys(rules).forEach(field => {
      const value = data[field];
      const isValid = rules[field](value);
      
      if (!isValid) {
        errors[field] = `Поле ${field} заполнено некорректно`;
      }
    });
    
    return errors;
  }
};

/**
 * Browser detection utilities
 */
export const browserUtils = {
  /**
   * Detect browser name and version
   */
  getBrowserInfo: () => {
    if (typeof navigator === 'undefined') {
      return { name: 'Unknown', version: 0, isModern: false };
    }
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
  },

  /**
   * Check if browser supports specific features
   */
  supportsFeature: (feature: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    switch (feature) {
      case 'fetch':
        return typeof fetch !== 'undefined';
      case 'promises':
        return typeof Promise !== 'undefined';
      case 'customElements':
        return 'customElements' in window;
      case 'intersectionObserver':
        return 'IntersectionObserver' in window;
      case 'webp':
        return mediaUtils.supportsImageFormat('image/webp');
      case 'cssGrid':
        return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('display', 'grid');
      case 'cssCustomProperties':
        return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', 'var(--test)');
      default:
        return false;
    }
  }
};