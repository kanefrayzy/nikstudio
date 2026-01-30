/**
 * Compatibility Error Handler
 * Handles browser compatibility errors and provides fallback mechanisms
 */

import { BrowserInfo, browserDetectionService } from './browser-detection';

export interface CompatibilityError {
  type: 'polyfill' | 'feature' | 'css' | 'media' | 'javascript' | 'network';
  feature: string;
  browser: BrowserInfo;
  fallbackApplied: boolean;
  message: string;
  originalError?: Error;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage?: string;
}

export interface FallbackStrategy {
  name: string;
  condition: (error: CompatibilityError) => boolean;
  apply: (error: CompatibilityError) => Promise<boolean>;
  description: string;
}

export interface CompatibilityErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableUserNotifications: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackStrategies: FallbackStrategy[];
}

/**
 * Default fallback strategies for common compatibility issues
 */
const DEFAULT_FALLBACK_STRATEGIES: FallbackStrategy[] = [
  {
    name: 'fetch-xhr-fallback',
    condition: (error) => error.feature === 'fetch' && error.type === 'polyfill',
    apply: async (_error) => {
      try {
        // Apply XMLHttpRequest-based fetch polyfill
        if (!window.fetch) {
          const { applyFetchFallback } = await import('./fallbacks/fetch-fallback');
          applyFetchFallback();
          return typeof window.fetch === 'function';
        }
        return true;
      } catch {
        return false;
      }
    },
    description: 'Применяет XMLHttpRequest-based fallback для fetch API'
  },
  {
    name: 'css-grid-flexbox-fallback',
    condition: (error) => error.feature === 'cssGrid' && error.type === 'css',
    apply: async (_error) => {
      try {
        // Add CSS class to enable flexbox fallbacks
        document.documentElement.classList.add('no-css-grid');
        return true;
      } catch {
        return false;
      }
    },
    description: 'Использует Flexbox как fallback для CSS Grid'
  },
  {
    name: 'intersection-observer-scroll-fallback',
    condition: (error) => error.feature === 'intersectionObserver' && error.type === 'polyfill',
    apply: async (_error) => {
      try {
        const { applyIntersectionObserverFallback } = await import('./fallbacks/intersection-observer-fallback');
        applyIntersectionObserverFallback();
        return 'IntersectionObserver' in window;
      } catch {
        return false;
      }
    },
    description: 'Применяет scroll-based fallback для IntersectionObserver'
  },
  {
    name: 'video-format-fallback',
    condition: (error) => error.type === 'media' && error.feature.includes('video'),
    apply: async (_error) => {
      try {
        // Switch to more compatible video format
        const videoElements = document.querySelectorAll('video[data-fallback-src]');
        videoElements.forEach(video => {
          const fallbackSrc = video.getAttribute('data-fallback-src');
          if (fallbackSrc) {
            (video as HTMLVideoElement).src = fallbackSrc;
          }
        });
        return true;
      } catch {
        return false;
      }
    },
    description: 'Переключается на более совместимый формат видео'
  },
  {
    name: 'image-format-fallback',
    condition: (error) => error.type === 'media' && error.feature.includes('image'),
    apply: async (_error) => {
      try {
        // Switch to more compatible image format
        const imageElements = document.querySelectorAll('img[data-fallback-src]');
        imageElements.forEach(img => {
          const fallbackSrc = img.getAttribute('data-fallback-src');
          if (fallbackSrc) {
            (img as HTMLImageElement).src = fallbackSrc;
          }
        });
        return true;
      } catch {
        return false;
      }
    },
    description: 'Переключается на более совместимый формат изображения'
  },
  {
    name: 'form-validation-fallback',
    condition: (error) => error.feature === 'formValidation' && error.type === 'feature',
    apply: async (_error) => {
      try {
        // Enable custom form validation
        document.documentElement.classList.add('custom-form-validation');
        const { enableCustomFormValidation } = await import('./fallbacks/form-validation-fallback');
        enableCustomFormValidation();
        return true;
      } catch {
        return false;
      }
    },
    description: 'Включает кастомную валидацию форм'
  }
];

/**
 * Default configuration for compatibility error handler
 */
const DEFAULT_CONFIG: CompatibilityErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: process.env.NODE_ENV === 'production',
  enableUserNotifications: true,
  maxRetries: 3,
  retryDelay: 1000,
  fallbackStrategies: DEFAULT_FALLBACK_STRATEGIES
};

/**
 * Compatibility Error Handler Implementation
 */
export class CompatibilityErrorHandler {
  private config: CompatibilityErrorHandlerConfig;
  private errorLog: CompatibilityError[] = [];
  private retryCount: Map<string, number> = new Map();
  private notificationQueue: CompatibilityError[] = [];
  private isProcessingNotifications = false;

  constructor(config?: Partial<CompatibilityErrorHandlerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupGlobalErrorHandling();
  }

  /**
   * Handle a compatibility error
   */
  async handleError(error: CompatibilityError): Promise<boolean> {
    // Log the error
    this.logError(error);

    // Try to apply fallback strategies
    const fallbackApplied = await this.applyFallbackStrategies(error);
    
    if (fallbackApplied) {
      error.fallbackApplied = true;
      this.logError({ ...error, message: `Fallback applied for ${error.feature}` });
    }

    // Show user notification if enabled and error is significant
    if (this.config.enableUserNotifications && error.severity !== 'low') {
      this.queueUserNotification(error);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(error);
    }

    return fallbackApplied;
  }

  /**
   * Create a compatibility error from various sources
   */
  createError(
    type: CompatibilityError['type'],
    feature: string,
    message: string,
    originalError?: Error,
    severity: CompatibilityError['severity'] = 'medium'
  ): CompatibilityError {
    const browser = browserDetectionService.getBrowserInfo();
    
    return {
      type,
      feature,
      browser,
      fallbackApplied: false,
      message,
      originalError,
      timestamp: Date.now(),
      severity,
      userMessage: this.generateUserMessage(type, feature, severity)
    };
  }

  /**
   * Handle polyfill loading errors
   */
  async handlePolyfillError(polyfillName: string, error: Error): Promise<boolean> {
    const compatError = this.createError(
      'polyfill',
      polyfillName,
      `Failed to load polyfill: ${polyfillName}`,
      error,
      'high'
    );

    return this.handleError(compatError);
  }

  /**
   * Handle CSS feature errors
   */
  async handleCSSError(feature: string, error?: Error): Promise<boolean> {
    const compatError = this.createError(
      'css',
      feature,
      `CSS feature not supported: ${feature}`,
      error,
      'medium'
    );

    return this.handleError(compatError);
  }

  /**
   * Handle media format errors
   */
  async handleMediaError(format: string, error?: Error): Promise<boolean> {
    const compatError = this.createError(
      'media',
      format,
      `Media format not supported: ${format}`,
      error,
      'medium'
    );

    return this.handleError(compatError);
  }

  /**
   * Handle JavaScript feature errors
   */
  async handleJavaScriptError(feature: string, error: Error): Promise<boolean> {
    const compatError = this.createError(
      'javascript',
      feature,
      `JavaScript feature error: ${feature}`,
      error,
      'high'
    );

    return this.handleError(compatError);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      withFallbacks: 0,
      recent: this.errorLog.filter(_e => Date.now() - _e.timestamp < 300000) // Last 5 minutes
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      if (error.fallbackApplied) {
        stats.withFallbacks++;
      }
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.retryCount.clear();
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): CompatibilityError[] {
    return this.errorLog
      .slice(-limit)
      .reverse(); // Most recent first (since errorLog is in chronological order)
  }

  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createError(
        'javascript',
        'unhandledPromise',
        'Unhandled promise rejection',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'high'
      );
      
      this.handleError(error);
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      // Skip if it's a network error (handled separately)
      if (event.filename && event.filename.includes('polyfill')) {
        const error = this.createError(
          'polyfill',
          'unknown',
          'Polyfill script error',
          event.error,
          'high'
        );
        
        this.handleError(error);
      }
    });
  }

  private async applyFallbackStrategies(error: CompatibilityError): Promise<boolean> {
    const applicableStrategies = this.config.fallbackStrategies.filter(
      strategy => strategy.condition(error)
    );

    if (applicableStrategies.length === 0) {
      return false;
    }

    // Try each applicable strategy
    for (const strategy of applicableStrategies) {
      try {
        const success = await strategy.apply(error);
        if (success) {
          this.logError({
            ...error,
            message: `Fallback strategy applied: ${strategy.name}`,
            severity: 'low'
          });
          return true;
        }
      } catch (strategyError) {
        this.logError({
          ...error,
          message: `Fallback strategy failed: ${strategy.name}`,
          originalError: strategyError instanceof Error ? strategyError : new Error(String(strategyError)),
          severity: 'medium'
        });
      }
    }

    return false;
  }

  private logError(error: CompatibilityError): void {
    if (!this.config.enableLogging) return;

    this.errorLog.push(error);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console logging based on severity
    const logMessage = `[Compatibility] ${error.type}/${error.feature}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        console.error(logMessage, error);
        break;
      case 'high':
        console.warn(logMessage, error);
        break;
      case 'medium':
        console.log(logMessage);
        break;
      case 'low':
        console.log(logMessage);
        break;
    }
  }

  private generateUserMessage(
    type: CompatibilityError['type'],
    feature: string,
    severity: CompatibilityError['severity']
  ): string {
    const messages = {
      polyfill: {
        low: 'Загружены дополнительные компоненты для совместимости',
        medium: 'Некоторые функции могут работать медленнее в вашем браузере',
        high: 'Обнаружены проблемы совместимости. Рекомендуем обновить браузер',
        critical: 'Ваш браузер не поддерживает необходимые функции. Пожалуйста, обновите браузер'
      },
      css: {
        low: 'Применены альтернативные стили для совместимости',
        medium: 'Некоторые элементы могут отображаться по-другому',
        high: 'Обнаружены проблемы с отображением. Рекомендуем обновить браузер',
        critical: 'Серьезные проблемы с отображением. Пожалуйста, обновите браузер'
      },
      media: {
        low: 'Используется альтернативный формат медиа',
        medium: 'Некоторые медиафайлы могут не воспроизводиться',
        high: 'Проблемы с воспроизведением медиа. Рекомендуем обновить браузер',
        critical: 'Медиафайлы не могут быть воспроизведены. Пожалуйста, обновите браузер'
      },
      javascript: {
        low: 'Применены альтернативные решения',
        medium: 'Некоторые функции могут работать по-другому',
        high: 'Обнаружены ошибки JavaScript. Рекомендуем обновить браузер',
        critical: 'Критические ошибки JavaScript. Пожалуйста, обновите браузер'
      },
      feature: {
        low: 'Используется упрощенная версия функции',
        medium: 'Некоторые функции недоступны в вашем браузере',
        high: 'Важные функции недоступны. Рекомендуем обновить браузер',
        critical: 'Критически важные функции недоступны. Пожалуйста, обновите браузер'
      },
      network: {
        low: 'Проблемы с загрузкой ресурсов',
        medium: 'Некоторые ресурсы не загружены',
        high: 'Серьезные проблемы с сетью',
        critical: 'Критические ресурсы недоступны'
      }
    };

    return messages[type]?.[severity] || 'Обнаружена проблема совместимости';
  }

  private queueUserNotification(error: CompatibilityError): void {
    this.notificationQueue.push(error);
    
    if (!this.isProcessingNotifications) {
      this.processNotificationQueue();
    }
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingNotifications || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingNotifications = true;

    try {
      // Group similar errors to avoid spam
      const groupedErrors = this.groupSimilarErrors(this.notificationQueue);
      
      for (const group of groupedErrors) {
        await this.showUserNotification(group);
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.notificationQueue = [];
      this.isProcessingNotifications = false;
    }
  }

  private groupSimilarErrors(errors: CompatibilityError[]): CompatibilityError[][] {
    const groups: Map<string, CompatibilityError[]> = new Map();
    
    errors.forEach(error => {
      const key = `${error.type}-${error.severity}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(error);
    });

    return Array.from(groups.values());
  }

  private async showUserNotification(errors: CompatibilityError[]): Promise<void> {
    if (typeof window === 'undefined') return;

    const primaryError = errors[0];
    const message = errors.length > 1 
      ? `${primaryError.userMessage} (и еще ${errors.length - 1} проблем)`
      : primaryError.userMessage;

    // Dispatch custom event for UI components to handle
    try {
      const event = new CustomEvent('compatibility-error', {
        detail: {
          errors,
          message,
          severity: primaryError.severity
        }
      });

      window.dispatchEvent(event);
    } catch (error) {
      // Fallback for environments where CustomEvent is not properly supported
      console.warn('Failed to dispatch compatibility error event:', error);
    }
  }

  private reportError(error: CompatibilityError): void {
    // In a real application, this would send data to analytics/monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'compatibility_error', {
        error_type: error.type,
        feature: error.feature,
        browser_name: error.browser.name,
        browser_version: error.browser.version,
        severity: error.severity,
        fallback_applied: error.fallbackApplied
      });
    }
  }
}

// Export singleton instance
export const compatibilityErrorHandler = new CompatibilityErrorHandler();

/**
 * Utility functions for common error handling patterns
 */
export const errorHandling = {
  /**
   * Wrap async function with compatibility error handling
   */
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    feature: string,
    _type: CompatibilityError['type'] = 'javascript'
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        await compatibilityErrorHandler.handleJavaScriptError(
          feature,
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    };
  },

  /**
   * Handle feature detection with fallback
   */
  detectFeatureWithFallback: async (
    feature: string,
    detector: () => boolean,
    fallbackHandler?: () => Promise<void>
  ): Promise<boolean> => {
    try {
      const supported = detector();
      
      if (!supported) {
        const error = compatibilityErrorHandler.createError(
          'feature',
          feature,
          `Feature not supported: ${feature}`,
          undefined,
          'medium'
        );
        
        const fallbackApplied = await compatibilityErrorHandler.handleError(error);
        
        if (!fallbackApplied && fallbackHandler) {
          await fallbackHandler();
          return true;
        }
        
        return fallbackApplied;
      }
      
      return true;
    } catch (error) {
      await compatibilityErrorHandler.handleJavaScriptError(
        feature,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }
};