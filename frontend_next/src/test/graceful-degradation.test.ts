/**
 * Graceful Degradation System Tests
 * Tests for degradation strategies and fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GracefulDegradationManager, DegradationStrategy } from '../lib/graceful-degradation';
import { browserDetectionService } from '../lib/browser-detection';

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
        cssGrid: false, // Simulate unsupported CSS Grid
        cssFlexbox: true,
        customProperties: false, // Simulate unsupported custom properties
        intersectionObserver: true,
        webp: false, // Simulate unsupported WebP
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

// Mock compatibility error handler
vi.mock('../lib/compatibility-error-handler', () => ({
  compatibilityErrorHandler: {
    createError: vi.fn((type, feature, message, error, severity) => ({
      type,
      feature,
      message,
      severity,
      fallbackApplied: false,
      browser: {},
      timestamp: Date.now()
    })),
    handleError: vi.fn().mockResolvedValue(true)
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

describe('GracefulDegradationManager', () => {
  let degradationManager: GracefulDegradationManager;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Reset DOM mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with default strategies', () => {
      degradationManager = new GracefulDegradationManager();
      expect(degradationManager).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customStrategies: DegradationStrategy[] = [
        {
          name: 'test-strategy',
          feature: 'testFeature',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Test fallback',
          userImpact: 'minimal'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: false,
        strategies: customStrategies
      });

      expect(degradationManager).toBeDefined();
    });
  });

  describe('Strategy Application', () => {
    beforeEach(() => {
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'css-grid-fallback',
          feature: 'cssGrid',
          condition: (browser) => !browser.features.cssGrid,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Use flexbox instead of CSS Grid',
          userImpact: 'minimal'
        },
        {
          name: 'webp-fallback',
          feature: 'webp',
          condition: (browser) => !browser.features.webp,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Use JPEG instead of WebP',
          userImpact: 'minimal'
        },
        {
          name: 'failing-strategy',
          feature: 'failingFeature',
          condition: () => true,
          apply: vi.fn().mockRejectedValue(new Error('Strategy failed')),
          fallbackDescription: 'This strategy fails',
          userImpact: 'significant'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: false,
        strategies: mockStrategies
      });
    });

    it('should apply applicable strategies during initialization', async () => {
      await degradationManager.initialize();

      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).toContain('css-grid-fallback');
      expect(appliedStrategies).toContain('webp-fallback');
      expect(appliedStrategies).not.toContain('failing-strategy');
    });

    it('should handle strategy failures gracefully', async () => {
      await degradationManager.initialize();

      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).not.toContain('failing-strategy');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('✗ Failed to apply degradation strategy: failing-strategy'),
        expect.any(String)
      );
    });

    it('should not apply strategies when auto-detection is disabled', async () => {
      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: false,
        enableUserNotifications: false,
        strategies: []
      });

      await degradationManager.initialize();

      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).toHaveLength(0);
    });
  });

  describe('Manual Strategy Application', () => {
    beforeEach(() => {
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'manual-strategy',
          feature: 'manualFeature',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Manual strategy',
          userImpact: 'minimal'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: false,
        enableUserNotifications: false,
        strategies: mockStrategies
      });
    });

    it('should apply specific strategy manually', async () => {
      const result = await degradationManager.applySpecificStrategy('manual-strategy');
      
      expect(result).toBe(true);
      
      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).toContain('manual-strategy');
    });

    it('should handle non-existent strategy', async () => {
      const result = await degradationManager.applySpecificStrategy('non-existent');
      
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Strategy not found: non-existent');
    });

    it('should not re-apply already applied strategy', async () => {
      await degradationManager.applySpecificStrategy('manual-strategy');
      const result = await degradationManager.applySpecificStrategy('manual-strategy');
      
      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('Strategy already applied: manual-strategy');
    });
  });

  describe('Strategy Condition Checking', () => {
    beforeEach(() => {
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'needed-strategy',
          feature: 'neededFeature',
          condition: (browser) => !browser.features.cssGrid, // Should be needed
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Needed strategy',
          userImpact: 'minimal'
        },
        {
          name: 'not-needed-strategy',
          feature: 'notNeededFeature',
          condition: (browser) => !browser.features.fetch, // Should not be needed
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Not needed strategy',
          userImpact: 'minimal'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: false,
        enableUserNotifications: false,
        strategies: mockStrategies
      });
    });

    it('should correctly identify needed strategies', () => {
      expect(degradationManager.isStrategyNeeded('needed-strategy')).toBe(true);
      expect(degradationManager.isStrategyNeeded('not-needed-strategy')).toBe(false);
    });

    it('should return false for non-existent strategies', () => {
      expect(degradationManager.isStrategyNeeded('non-existent')).toBe(false);
    });
  });

  describe('Degradation Summary', () => {
    beforeEach(() => {
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'minimal-impact',
          feature: 'feature1',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Minimal impact strategy',
          userImpact: 'minimal'
        },
        {
          name: 'significant-impact',
          feature: 'feature2',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Significant impact strategy',
          userImpact: 'significant'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: false,
        strategies: mockStrategies
      });
    });

    it('should provide accurate degradation summary', async () => {
      await degradationManager.initialize();

      const summary = degradationManager.getDegradationSummary();
      
      expect(summary.totalApplied).toBe(2);
      expect(summary.strategies).toHaveLength(2);
      expect(summary.impactLevel).toBe('significant'); // Should be highest impact level
      
      expect(summary.strategies[0]).toEqual({
        name: 'minimal-impact',
        feature: 'feature1',
        description: 'Minimal impact strategy',
        userImpact: 'minimal'
      });
    });

    it('should calculate correct impact level', async () => {
      // Test with only minimal impact strategies
      const minimalStrategies: DegradationStrategy[] = [
        {
          name: 'minimal1',
          feature: 'feature1',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Minimal 1',
          userImpact: 'minimal'
        }
      ];

      const minimalManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: false,
        strategies: minimalStrategies
      });

      await minimalManager.initialize();
      const summary = minimalManager.getDegradationSummary();
      expect(summary.impactLevel).toBe('minimal');
    });
  });

  describe('User Notifications', () => {
    it('should dispatch notification events when enabled', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'notification-strategy',
          feature: 'notificationFeature',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'Notification strategy',
          userImpact: 'moderate'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: true,
        strategies: mockStrategies
      });

      await degradationManager.initialize();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'compatibility-error',
          detail: expect.objectContaining({
            message: expect.stringContaining('альтернативные решения'),
            severity: expect.any(String)
          })
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should not dispatch notifications when disabled', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      const mockStrategies: DegradationStrategy[] = [
        {
          name: 'no-notification-strategy',
          feature: 'noNotificationFeature',
          condition: () => true,
          apply: vi.fn().mockResolvedValue(true),
          fallbackDescription: 'No notification strategy',
          userImpact: 'moderate'
        }
      ];

      degradationManager = new GracefulDegradationManager({
        enableAutoDetection: true,
        enableUserNotifications: false,
        strategies: mockStrategies
      });

      await degradationManager.initialize();

      expect(dispatchEventSpy).not.toHaveBeenCalled();

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Default Strategies', () => {
    it('should include CSS Grid to Flexbox fallback', async () => {
      // Mock browser without CSS Grid support
      vi.mocked(browserDetectionService.getBrowserInfo).mockReturnValue({
        name: 'chrome',
        version: 90,
        isSupported: true,
        features: {
          fetch: true,
          promises: true,
          asyncAwait: true,
          cssGrid: false, // No CSS Grid support
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

      degradationManager = new GracefulDegradationManager();
      await degradationManager.initialize();

      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).toContain('css-grid-to-flexbox');
      
      // Check that CSS classes were added
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('no-css-grid');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('use-flexbox-fallback');
    });

    it('should include WebP to JPEG fallback', async () => {
      // Mock browser without WebP support
      vi.mocked(browserDetectionService.getBrowserInfo).mockReturnValue({
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
          webp: false, // No WebP support
          webm: true,
          mp4: true,
          fileApi: true,
          formData: true,
          customEvent: true,
          objectAssign: true
        }
      });

      degradationManager = new GracefulDegradationManager();
      await degradationManager.initialize();

      const appliedStrategies = degradationManager.getAppliedStrategies();
      expect(appliedStrategies).toContain('webp-to-jpeg');
      
      // Check that CSS classes were added
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('no-webp');
    });
  });
});