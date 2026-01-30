/**
 * Compatibility Error Handler Tests
 * Tests for error detection, logging, and fallback systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompatibilityErrorHandler, CompatibilityError } from '../lib/compatibility-error-handler';
// import { browserDetectionService } from '../lib/browser-detection';

// Mock browser detection service
vi.mock('../lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: vi.fn(() => ({
      name: 'chrome',
      version: 90,
      isSupported: true,
      features: {
        fetch: true,
        promises: true,
        asyncAwait: true,
        cssGrid: true,
        cssFlexbox: true,
        customProperties: true,
        intersectionObserver: true,
        webp: true,
        webm: true,
        mp4: true,
        fileApi: true,
        formData: true,
        customEvent: true,
        objectAssign: true
      }
    }))
  }
}));

// Mock DOM environment
Object.defineProperty(window, 'CustomEvent', {
  writable: true,
  value: vi.fn().mockImplementation((event, params) => {
    const mockEvent = {
      type: event,
      detail: params?.detail,
      bubbles: params?.bubbles || false,
      cancelable: params?.cancelable || false
    };
    // Add Event prototype methods
    Object.setPrototypeOf(mockEvent, Event.prototype);
    return mockEvent;
  })
});

Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: vi.fn()
});

describe('CompatibilityErrorHandler', () => {
  let errorHandler: CompatibilityErrorHandler;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    errorHandler = new CompatibilityErrorHandler({
      enableLogging: true,
      enableReporting: false,
      enableUserNotifications: false,
      maxRetries: 2,
      retryDelay: 100,
      fallbackStrategies: []
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorHandler.clearErrorLog();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Error Creation', () => {
    it('should create compatibility error with correct properties', () => {
      const error = errorHandler.createError(
        'polyfill',
        'fetch',
        'Test error message',
        new Error('Original error'),
        'high'
      );

      expect(error.type).toBe('polyfill');
      expect(error.feature).toBe('fetch');
      expect(error.message).toBe('Test error message');
      expect(error.severity).toBe('high');
      expect(error.fallbackApplied).toBe(false);
      expect(error.browser).toBeDefined();
      expect(error.timestamp).toBeGreaterThan(0);
      expect(error.userMessage).toBeDefined();
    });

    it('should generate appropriate user messages for different error types', () => {
      const polyfillError = errorHandler.createError('polyfill', 'fetch', 'Test', undefined, 'high');
      const cssError = errorHandler.createError('css', 'grid', 'Test', undefined, 'medium');
      const mediaError = errorHandler.createError('media', 'webp', 'Test', undefined, 'low');

      expect(polyfillError.userMessage).toContain('браузер');
      expect(cssError.userMessage).toContain('отображ');
      expect(mediaError.userMessage).toContain('медиа');
    });
  });

  describe('Error Handling', () => {
    it('should handle polyfill errors', async () => {
      const result = await errorHandler.handlePolyfillError('fetch', new Error('Fetch failed'));
      
      expect(result).toBe(false); // No fallback strategies configured
      
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.polyfill).toBe(1);
    });

    it('should handle CSS errors', async () => {
      const result = await errorHandler.handleCSSError('cssGrid');
      
      expect(result).toBe(false);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.css).toBe(1);
    });

    it('should handle media errors', async () => {
      const result = await errorHandler.handleMediaError('webp');
      
      expect(result).toBe(false);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.media).toBe(1);
    });

    it('should handle JavaScript errors', async () => {
      const result = await errorHandler.handleJavaScriptError('asyncAwait', new Error('Async error'));
      
      expect(result).toBe(false);
      
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byType.javascript).toBe(1);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with appropriate console methods based on severity', async () => {
      await errorHandler.handleError(errorHandler.createError('javascript', 'test', 'Low severity', undefined, 'low'));
      await errorHandler.handleError(errorHandler.createError('javascript', 'test', 'Medium severity', undefined, 'medium'));
      await errorHandler.handleError(errorHandler.createError('javascript', 'test', 'High severity', undefined, 'high'));
      await errorHandler.handleError(errorHandler.createError('javascript', 'test', 'Critical severity', undefined, 'critical'));

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Medium severity'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('High severity'), expect.any(Object));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Critical severity'), expect.any(Object));
    });

    it('should maintain error log with size limit', async () => {
      // Create more than 100 errors to test size limit
      for (let i = 0; i < 105; i++) {
        await errorHandler.handleError(errorHandler.createError('javascript', `test${i}`, `Error ${i}`));
      }

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(100); // Should be limited to 100
    });
  });

  describe('Error Statistics', () => {
    it('should provide accurate error statistics', async () => {
      await errorHandler.handlePolyfillError('fetch', new Error('Fetch error'));
      await errorHandler.handleCSSError('grid');
      await errorHandler.handleMediaError('webp');
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType.polyfill).toBe(1);
      expect(stats.byType.css).toBe(1);
      expect(stats.byType.media).toBe(1);
      expect(stats.withFallbacks).toBe(0);
    });

    it('should track recent errors correctly', async () => {
      await errorHandler.handleError(errorHandler.createError('javascript', 'test1', 'Error 1'));
      await errorHandler.handleError(errorHandler.createError('javascript', 'test2', 'Error 2'));
      
      const recentErrors = errorHandler.getRecentErrors(5);
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe('Error 2'); // Most recent first
      expect(recentErrors[1].message).toBe('Error 1');
    });
  });

  describe('Fallback Strategies', () => {
    it('should apply fallback strategies when available', async () => {
      const mockStrategy = {
        name: 'test-strategy',
        condition: (error: CompatibilityError) => error.feature === 'test',
        apply: vi.fn().mockResolvedValue(true),
        description: 'Test strategy'
      };

      const handlerWithStrategy = new CompatibilityErrorHandler({
        enableLogging: true,
        enableReporting: false,
        enableUserNotifications: false,
        maxRetries: 2,
        retryDelay: 100,
        fallbackStrategies: [mockStrategy]
      });

      const error = handlerWithStrategy.createError('feature', 'test', 'Test error');
      const result = await handlerWithStrategy.handleError(error);

      expect(result).toBe(true);
      expect(mockStrategy.apply).toHaveBeenCalledWith(error);
      expect(error.fallbackApplied).toBe(true);
    });

    it('should handle fallback strategy failures gracefully', async () => {
      const mockStrategy = {
        name: 'failing-strategy',
        condition: (error: CompatibilityError) => error.feature === 'test',
        apply: vi.fn().mockRejectedValue(new Error('Strategy failed')),
        description: 'Failing strategy'
      };

      const handlerWithStrategy = new CompatibilityErrorHandler({
        enableLogging: true,
        enableReporting: false,
        enableUserNotifications: false,
        maxRetries: 2,
        retryDelay: 100,
        fallbackStrategies: [mockStrategy]
      });

      const error = handlerWithStrategy.createError('feature', 'test', 'Test error');
      const result = await handlerWithStrategy.handleError(error);

      expect(result).toBe(false);
      expect(mockStrategy.apply).toHaveBeenCalledWith(error);
      expect(error.fallbackApplied).toBe(false);
    });
  });

  describe('User Notifications', () => {
    it('should dispatch custom events for user notifications', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      const handlerWithNotifications = new CompatibilityErrorHandler({
        enableLogging: true,
        enableReporting: false,
        enableUserNotifications: true,
        maxRetries: 2,
        retryDelay: 100,
        fallbackStrategies: []
      });

      const error = handlerWithNotifications.createError('javascript', 'test', 'Test error', undefined, 'high');
      await handlerWithNotifications.handleError(error);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'compatibility-error',
          detail: expect.objectContaining({
            errors: expect.arrayContaining([error]),
            message: expect.any(String),
            severity: 'high'
          })
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should not dispatch notifications for low severity errors', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      const handlerWithNotifications = new CompatibilityErrorHandler({
        enableLogging: true,
        enableReporting: false,
        enableUserNotifications: true,
        maxRetries: 2,
        retryDelay: 100,
        fallbackStrategies: []
      });

      const error = handlerWithNotifications.createError('javascript', 'test', 'Test error', undefined, 'low');
      await handlerWithNotifications.handleError(error);

      expect(dispatchEventSpy).not.toHaveBeenCalled();

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Error Log Management', () => {
    it('should clear error log', async () => {
      await errorHandler.handleError(errorHandler.createError('javascript', 'test', 'Test error'));
      
      let stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);

      errorHandler.clearErrorLog();
      
      stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(0);
    });

    it('should get recent errors with limit', async () => {
      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(errorHandler.createError('javascript', `test${i}`, `Error ${i}`));
      }

      const recentErrors = errorHandler.getRecentErrors(5);
      expect(recentErrors).toHaveLength(5);
      expect(recentErrors[0].message).toBe('Error 9'); // Most recent first
    });
  });
});

describe('Error Handling Utilities', () => {
  describe('withErrorHandling', () => {
    it('should wrap async functions with error handling', async () => {
      const { errorHandling } = await import('../lib/compatibility-error-handler');
      
      const mockFunction = vi.fn().mockResolvedValue('success');
      const wrappedFunction = errorHandling.withErrorHandling(mockFunction, 'testFeature');

      const result = await wrappedFunction('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle errors in wrapped functions', async () => {
      const { errorHandling } = await import('../lib/compatibility-error-handler');
      
      const mockFunction = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFunction = errorHandling.withErrorHandling(mockFunction, 'testFeature');

      const result = await wrappedFunction();
      
      expect(result).toBeNull();
      expect(mockFunction).toHaveBeenCalled();
    });
  });

  describe('detectFeatureWithFallback', () => {
    it('should detect supported features', async () => {
      const { errorHandling } = await import('../lib/compatibility-error-handler');
      
      const detector = vi.fn().mockReturnValue(true);
      const result = await errorHandling.detectFeatureWithFallback('testFeature', detector);

      expect(result).toBe(true);
      expect(detector).toHaveBeenCalled();
    });

    it('should handle unsupported features with fallback', async () => {
      const { errorHandling } = await import('../lib/compatibility-error-handler');
      
      const detector = vi.fn().mockReturnValue(false);
      const fallbackHandler = vi.fn().mockResolvedValue(undefined);
      
      const result = await errorHandling.detectFeatureWithFallback('testFeature', detector, fallbackHandler);

      expect(result).toBe(true); // Fallback was applied
      expect(detector).toHaveBeenCalled();
      expect(fallbackHandler).toHaveBeenCalled();
    });

    it('should handle detector errors', async () => {
      const { errorHandling } = await import('../lib/compatibility-error-handler');
      
      const detector = vi.fn().mockImplementation(() => {
        throw new Error('Detector error');
      });
      
      const result = await errorHandling.detectFeatureWithFallback('testFeature', detector);

      expect(result).toBe(false);
      expect(detector).toHaveBeenCalled();
    });
  });
});