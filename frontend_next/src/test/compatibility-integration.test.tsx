/**
 * Compatibility Integration Tests
 * Tests the complete error handling and fallback system working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CompatibilityProvider } from '../components/CompatibilityProvider';
import { CompatibilityErrorNotification } from '../components/CompatibilityErrorNotification';
import { browserDetectionService } from '../lib/browser-detection';
import { compatibilityErrorHandler } from '../lib/compatibility-error-handler';
// import { gracefulDegradationManager } from '../lib/graceful-degradation';

// Mock browser detection with various scenarios
const mockBrowserInfo = {
  name: 'chrome' as const,
  version: 85, // Older version to trigger some compatibility issues
  isSupported: true,
  features: {
    fetch: false, // Will need polyfill
    promises: true,
    asyncAwait: true,
    cssGrid: false, // Will need degradation
    cssFlexbox: true,
    customProperties: false, // Will need degradation
    intersectionObserver: false, // Will need polyfill
    webp: false, // Will need degradation
    webm: true,
    mp4: true,
    fileApi: true,
    formData: true,
    customEvent: false, // Will need polyfill
    objectAssign: true
  }
};

vi.mock('../lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: vi.fn(() => mockBrowserInfo)
  }
}));

// Mock polyfill manager
vi.mock('../lib/polyfill-manager', () => ({
  initializePolyfills: vi.fn().mockResolvedValue([
    { name: 'fetch', loaded: true, fallbackApplied: true },
    { name: 'intersectionObserver', loaded: true, fallbackApplied: false },
    { name: 'customEvent', loaded: false, error: new Error('Failed to load') }
  ]),
  polyfillManager: {
    getLoadedPolyfills: vi.fn(() => ['fetch', 'intersectionObserver']),
    isPolyfillLoaded: vi.fn((name: string) => ['fetch', 'intersectionObserver'].includes(name))
  }
}));

// Mock DOM environment
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    }
  }
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: vi.fn()
  }
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName) => ({
    tagName: tagName.toUpperCase(),
    textContent: '',
    style: { cssText: '' },
    setAttribute: vi.fn(),
    getAttribute: vi.fn()
  }))
});

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => [])
});

// Mock window.fetch for testing
Object.defineProperty(window, 'fetch', {
  writable: true,
  value: undefined
});

// Test component that triggers compatibility issues
function TestComponent() {
  const [error, setError] = React.useState<string | null>(null);

  const triggerFetchError = async () => {
    try {
      if (!window.fetch) {
        throw new Error('Fetch not available');
      }
      await window.fetch('/test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Trigger compatibility error
      await compatibilityErrorHandler.handleJavaScriptError(
        'fetch',
        err instanceof Error ? err : new Error(String(err))
      );
    }
  };

  const triggerCSSError = async () => {
    // Simulate CSS feature detection failure
    await compatibilityErrorHandler.handleCSSError('cssGrid');
  };

  const triggerMediaError = async () => {
    // Simulate media format error
    await compatibilityErrorHandler.handleMediaError('webp');
  };

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={triggerFetchError}>Trigger Fetch Error</button>
      <button onClick={triggerCSSError}>Trigger CSS Error</button>
      <button onClick={triggerMediaError}>Trigger Media Error</button>
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
}

describe('Compatibility Integration', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear error handler state
    compatibilityErrorHandler.clearErrorLog();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Complete Compatibility System', () => {
    it('should initialize all compatibility systems', async () => {
      const onInitialized = vi.fn();
      
      render(
        <CompatibilityProvider
          onInitialized={onInitialized}
          enableErrorNotifications={false}
        >
          <TestComponent />
        </CompatibilityProvider>
      );

      await waitFor(() => {
        expect(onInitialized).toHaveBeenCalled();
      });

      const status = onInitialized.mock.calls[0][0];
      expect(status).toEqual({
        browserSupported: true,
        polyfillsLoaded: 2, // fetch and intersectionObserver
        degradationsApplied: expect.any(Number),
        criticalIssues: expect.any(Number),
        overallStatus: expect.any(String)
      });
    });

    it('should handle polyfill loading with fallbacks', async () => {
      render(
        <CompatibilityProvider enableErrorNotifications={false}>
          <TestComponent />
        </CompatibilityProvider>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Polyfills loaded successfully')
        );
      });

      // Check that polyfills were attempted to be loaded
      const { initializePolyfills } = await import('../lib/polyfill-manager');
      expect(initializePolyfills).toHaveBeenCalled();
    });

    it('should apply graceful degradation strategies', async () => {
      render(
        <CompatibilityProvider enableErrorNotifications={false}>
          <TestComponent />
        </CompatibilityProvider>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Initializing graceful degradation')
        );
      });

      // Check that CSS classes were added for degradation
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('no-css-grid');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('no-custom-properties');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('no-webp');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle and display compatibility errors', async () => {
      render(
        <div>
          <CompatibilityProvider enableErrorNotifications={true}>
            <TestComponent />
          </CompatibilityProvider>
        </div>
      );

      const fetchButton = screen.getByText('Trigger Fetch Error');
      fetchButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Fetch not available');
      });

      // Check that error was logged
      const errorStats = compatibilityErrorHandler.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
    });

    it('should show user notifications for compatibility issues', async () => {
      const { container } = render(
        <div>
          <CompatibilityProvider enableErrorNotifications={true}>
            <TestComponent />
          </CompatibilityProvider>
        </div>
      );

      // Trigger a high-severity error
      const cssButton = screen.getByText('Trigger CSS Error');
      cssButton.click();

      // Wait for notification to appear
      await waitFor(() => {
        const notifications = container.querySelectorAll('[role="alert"]');
        expect(notifications.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should apply fallback strategies when errors occur', async () => {
      const onCompatibilityIssue = vi.fn();
      
      render(
        <CompatibilityProvider
          enableErrorNotifications={false}
          onCompatibilityIssue={onCompatibilityIssue}
        >
          <TestComponent />
        </CompatibilityProvider>
      );

      const mediaButton = screen.getByText('Trigger Media Error');
      mediaButton.click();

      await waitFor(() => {
        expect(onCompatibilityIssue).toHaveBeenCalled();
      });

      // Check that fallback was applied
      const issues = onCompatibilityIssue.mock.calls.map(call => call[0]);
      const mediaIssue = issues.find(issue => issue.feature === 'webp');
      expect(mediaIssue).toBeDefined();
    });
  });

  describe('Notification System Integration', () => {
    it('should display notifications with correct severity styling', async () => {
      const { container } = render(
        <div>
          <CompatibilityErrorNotification />
          <button
            onClick={() => {
              const event = new CustomEvent('compatibility-error', {
                detail: {
                  errors: [{
                    type: 'javascript',
                    feature: 'test',
                    browser: mockBrowserInfo,
                    fallbackApplied: false,
                    message: 'Test error',
                    timestamp: Date.now(),
                    severity: 'high',
                    userMessage: 'Test user message'
                  }],
                  message: 'Test user message',
                  severity: 'high'
                }
              });
              window.dispatchEvent(event);
            }}
          >
            Trigger Notification
          </button>
        </div>
      );

      const triggerButton = screen.getByText('Trigger Notification');
      triggerButton.click();

      await waitFor(() => {
        const notification = container.querySelector('[role="alert"]');
        expect(notification).toBeInTheDocument();
        expect(notification).toHaveTextContent('Test user message');
      });
    });

    it('should group similar notifications', async () => {
      const { container } = render(<CompatibilityErrorNotification />);

      // Trigger multiple similar errors
      for (let i = 0; i < 3; i++) {
        const event = new CustomEvent('compatibility-error', {
          detail: {
            errors: [{
              type: 'polyfill',
              feature: `test${i}`,
              browser: mockBrowserInfo,
              fallbackApplied: false,
              message: `Test error ${i}`,
              timestamp: Date.now(),
              severity: 'medium',
              userMessage: 'Similar error'
            }],
            message: 'Similar error',
            severity: 'medium'
          }
        });
        window.dispatchEvent(event);
      }

      await waitFor(() => {
        const notifications = container.querySelectorAll('[role="alert"]');
        // Should group similar notifications
        expect(notifications.length).toBeLessThanOrEqual(3);
      });
    });

    it('should auto-hide notifications after delay', async () => {
      const { container } = render(
        <CompatibilityErrorNotification autoHide={true} autoHideDelay={1000} />
      );

      const event = new CustomEvent('compatibility-error', {
        detail: {
          errors: [{
            type: 'feature',
            feature: 'test',
            browser: mockBrowserInfo,
            fallbackApplied: false,
            message: 'Auto-hide test',
            timestamp: Date.now(),
            severity: 'low',
            userMessage: 'This should auto-hide'
          }],
          message: 'This should auto-hide',
          severity: 'low'
        }
      });
      window.dispatchEvent(event);

      // Should appear initially
      await waitFor(() => {
        expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
      });

      // Should disappear after delay
      await waitFor(() => {
        expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Browser Compatibility Scenarios', () => {
    it('should handle unsupported browser gracefully', async () => {
      // Mock unsupported browser
      vi.mocked(browserDetectionService.getBrowserInfo).mockReturnValue({
        ...mockBrowserInfo,
        name: 'unknown',
        version: 0,
        isSupported: false
      });

      const onInitialized = vi.fn();
      
      render(
        <CompatibilityProvider
          onInitialized={onInitialized}
          enableErrorNotifications={false}
        >
          <TestComponent />
        </CompatibilityProvider>
      );

      await waitFor(() => {
        expect(onInitialized).toHaveBeenCalled();
      });

      const status = onInitialized.mock.calls[0][0];
      expect(status.browserSupported).toBe(false);
      expect(status.overallStatus).toBe('poor');
    });

    it('should handle modern browser with full support', async () => {
      // Mock modern browser with full support
      vi.mocked(browserDetectionService.getBrowserInfo).mockReturnValue({
        name: 'chrome',
        version: 100,
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
      });

      const onInitialized = vi.fn();
      
      render(
        <CompatibilityProvider
          onInitialized={onInitialized}
          enableErrorNotifications={false}
        >
          <TestComponent />
        </CompatibilityProvider>
      );

      await waitFor(() => {
        expect(onInitialized).toHaveBeenCalled();
      });

      const status = onInitialized.mock.calls[0][0];
      expect(status.browserSupported).toBe(true);
      expect(status.overallStatus).toBe('excellent');
    });
  });

  describe('Performance and Memory', () => {
    it('should limit error log size to prevent memory issues', async () => {
      render(
        <CompatibilityProvider enableErrorNotifications={false}>
          <TestComponent />
        </CompatibilityProvider>
      );

      // Generate many errors
      for (let i = 0; i < 150; i++) {
        await compatibilityErrorHandler.handleJavaScriptError(
          `test${i}`,
          new Error(`Error ${i}`)
        );
      }

      const errorStats = compatibilityErrorHandler.getErrorStats();
      expect(errorStats.total).toBeLessThanOrEqual(100); // Should be limited
    });

    it('should throttle notification display', async () => {
      const { container } = render(<CompatibilityErrorNotification maxNotifications={2} />);

      // Trigger many notifications quickly
      for (let i = 0; i < 5; i++) {
        const event = new CustomEvent('compatibility-error', {
          detail: {
            errors: [{
              type: 'feature',
              feature: `test${i}`,
              browser: mockBrowserInfo,
              fallbackApplied: false,
              message: `Error ${i}`,
              timestamp: Date.now(),
              severity: 'medium',
              userMessage: `Error ${i}`
            }],
            message: `Error ${i}`,
            severity: 'medium'
          }
        });
        window.dispatchEvent(event);
      }

      await waitFor(() => {
        const notifications = container.querySelectorAll('[role="alert"]');
        expect(notifications.length).toBeLessThanOrEqual(2); // Should be limited
      });
    });
  });
});