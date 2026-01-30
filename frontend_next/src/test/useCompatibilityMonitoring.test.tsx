/**
 * Tests for Compatibility Monitoring Hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { 
  useCompatibilityMonitoring,
  usePolyfillMonitoring,
  useFeatureDetectionMonitoring,
  useComponentCompatibilityMonitoring,
  useAdminCompatibilityMonitoring
} from '@/hooks/useCompatibilityMonitoring';
import { 
  CompatibilityMonitoringProvider,
  useCompatibilityMonitoringContext
} from '@/components/CompatibilityMonitoringProvider';
import { compatibilityMonitoring } from '@/lib/compatibility-monitoring';

// Mock the monitoring service
vi.mock('@/lib/compatibility-monitoring', () => ({
  compatibilityMonitoring: {
    trackBrowserUsage: vi.fn(),
    trackFeatureSupport: vi.fn(),
    trackCompatibilityError: vi.fn(),
    trackPerformance: vi.fn(),
    trackPolyfillPerformance: vi.fn(),
    trackDetectionPerformance: vi.fn(),
    trackFallbackPerformance: vi.fn(),
    flush: vi.fn(),
    stop: vi.fn(),
    generateReport: vi.fn(() => ({
      browserDistribution: {},
      featureSupport: {},
      errorSummary: { total: 0, bySeverity: {}, byType: {}, fallbackSuccess: 0 },
      performanceImpact: { polyfillOverhead: 0, detectionTime: 0, fallbackRenderTime: 0 },
      timeRange: { start: Date.now() - 3600000, end: Date.now() }
    })),
    getBrowserStats: vi.fn(() => ({ totalSessions: 0 })),
    getFeatureStats: vi.fn(() => ({})),
    getErrorStats: vi.fn(() => ({ total: 0 })),
    getPerformanceStats: vi.fn(() => ({}))
  },
  monitoringUtils: {
    trackPolyfillLoad: vi.fn(),
    trackFeatureDetection: vi.fn(),
    trackFallbackRender: vi.fn()
  },
  CompatibilityMonitoringService: vi.fn()
}));

vi.mock('@/lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: vi.fn(() => ({
      name: 'chrome',
      version: 91,
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

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true
});

// Mock window and document
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: { href: 'https://example.com' },
    innerWidth: 1366,
    innerHeight: 768
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    referrer: 'https://google.com'
  },
  writable: true
});

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <CompatibilityMonitoringProvider enableInDevelopment={true}>
      {children}
    </CompatibilityMonitoringProvider>
  );
}

describe('useCompatibilityMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useCompatibilityMonitoring(), {
      wrapper: TestWrapper
    });

    expect(result.current.isMonitoringEnabled).toBe(true);
    expect(typeof result.current.trackFeature).toBe('function');
    expect(typeof result.current.trackError).toBe('function');
    expect(typeof result.current.trackPerformance).toBe('function');
  });

  it('should track browser usage on mount when enabled', () => {
    renderHook(() => useCompatibilityMonitoring({ trackPageView: true }), {
      wrapper: TestWrapper
    });

    expect(compatibilityMonitoring.trackBrowserUsage).toHaveBeenCalled();
  });

  it('should not track browser usage when disabled', () => {
    renderHook(() => useCompatibilityMonitoring({ trackPageView: false }), {
      wrapper: TestWrapper
    });

    expect(compatibilityMonitoring.trackBrowserUsage).not.toHaveBeenCalled();
  });

  it('should track feature usage', () => {
    const { result } = renderHook(() => useCompatibilityMonitoring(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackFeature('fetch', 'fetch-polyfill');
    });

    expect(compatibilityMonitoring.trackFeatureSupport).toHaveBeenCalledWith('fetch', 'fetch-polyfill');
  });

  it('should track performance metrics', () => {
    const { result } = renderHook(() => useCompatibilityMonitoring({ component: 'TestComponent' }), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackPerformance('render_time', 150, 'rendering');
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'TestComponent_render_time',
      150,
      'ms',
      'rendering'
    );
  });

  it('should track component mount and unmount performance', () => {
    const { unmount } = renderHook(
      () => useCompatibilityMonitoring({ component: 'TestComponent', trackPerformance: true }),
      { wrapper: TestWrapper }
    );

    // Mount performance should be tracked
    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'component_mount_TestComponent',
      expect.any(Number),
      'ms',
      'rendering'
    );

    // Clear previous calls
    vi.clearAllMocks();

    // Unmount should track lifetime
    unmount();

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'component_lifetime_TestComponent',
      expect.any(Number),
      'ms',
      'rendering'
    );
  });
});

describe('usePolyfillMonitoring', () => {
  it('should track polyfill loading with performance', async () => {
    const { result } = renderHook(() => usePolyfillMonitoring(), {
      wrapper: TestWrapper
    });

    const mockLoadFn = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      const success = await result.current.loadPolyfillWithTracking(
        'fetch-polyfill',
        mockLoadFn,
        'fetch'
      );
      expect(success).toBe(true);
    });

    expect(mockLoadFn).toHaveBeenCalled();
    expect(compatibilityMonitoring.trackFeatureSupport).toHaveBeenCalledWith('fetch', 'fetch-polyfill');
    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'polyfill_success_fetch-polyfill',
      expect.any(Number),
      'polyfill'
    );
  });

  it('should handle polyfill loading errors', async () => {
    const { result } = renderHook(() => usePolyfillMonitoring(), {
      wrapper: TestWrapper
    });

    const mockLoadFn = vi.fn().mockRejectedValue(new Error('Load failed'));

    await act(async () => {
      const success = await result.current.loadPolyfillWithTracking(
        'fetch-polyfill',
        mockLoadFn
      );
      expect(success).toBe(false);
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'polyfill_error_fetch-polyfill',
      expect.any(Number),
      'polyfill'
    );
  });
});

describe('useFeatureDetectionMonitoring', () => {
  it('should track feature detection with timing', () => {
    const { result } = renderHook(() => useFeatureDetectionMonitoring(), {
      wrapper: TestWrapper
    });

    const mockDetectionFn = vi.fn().mockReturnValue(true);

    act(() => {
      const detected = result.current.detectFeatureWithTracking('cssGrid', mockDetectionFn);
      expect(detected).toBe(true);
    });

    expect(mockDetectionFn).toHaveBeenCalled();
    expect(compatibilityMonitoring.trackFeatureSupport).toHaveBeenCalledWith('cssGrid');
  });

  it('should handle unsupported features with fallback', () => {
    const { result } = renderHook(() => useFeatureDetectionMonitoring(), {
      wrapper: TestWrapper
    });

    const mockDetectionFn = vi.fn().mockReturnValue(false);
    const mockFallbackFn = vi.fn();

    act(() => {
      const detected = result.current.detectFeatureWithTracking(
        'cssGrid',
        mockDetectionFn,
        mockFallbackFn
      );
      expect(detected).toBe(false);
    });

    expect(mockFallbackFn).toHaveBeenCalled();
    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'fallback_cssGrid',
      expect.any(Number),
      'fallback'
    );
  });
});

describe('useComponentCompatibilityMonitoring', () => {
  it('should track component-specific metrics', () => {
    const { result } = renderHook(() => useComponentCompatibilityMonitoring('VideoPlayer'), {
      wrapper: TestWrapper
    });

    expect(result.current.componentName).toBe('VideoPlayer');

    act(() => {
      result.current.trackComponentFeature('autoplay', 'autoplay-polyfill');
    });

    expect(compatibilityMonitoring.trackFeatureSupport).toHaveBeenCalledWith(
      'VideoPlayer_autoplay',
      'autoplay-polyfill'
    );
  });

  it('should track component errors', () => {
    const { result } = renderHook(() => useComponentCompatibilityMonitoring('VideoPlayer'), {
      wrapper: TestWrapper
    });

    const testError = new Error('Video playback failed');

    act(() => {
      result.current.trackComponentError('playback', testError, 'high');
    });

    expect(compatibilityMonitoring.trackCompatibilityError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'javascript',
        feature: 'VideoPlayer_playback',
        severity: 'high',
        message: 'Component error in VideoPlayer: Video playback failed',
        originalError: testError
      })
    );
  });

  it('should track component performance', () => {
    const { result } = renderHook(() => useComponentCompatibilityMonitoring('VideoPlayer'), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackComponentPerformance('load_video', 500, 'rendering');
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'VideoPlayer_load_video',
      500,
      'rendering'
    );
  });
});

describe('useAdminCompatibilityMonitoring', () => {
  it('should track admin actions', () => {
    const { result } = renderHook(() => useAdminCompatibilityMonitoring(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackAdminAction('create_project', 1500, true);
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_action_create_project',
      1500,
      'rendering'
    );

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_action_create_project_success',
      1,
      'count'
    );
  });

  it('should track file uploads', () => {
    const { result } = renderHook(() => useAdminCompatibilityMonitoring(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackFileUpload('image', 1024000, 2500, true);
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_upload_image_time',
      2500,
      'rendering'
    );

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_upload_image_size',
      1024000,
      'bytes'
    );

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_upload_image_success',
      1,
      'count'
    );
  });

  it('should track failed file uploads', () => {
    const { result } = renderHook(() => useAdminCompatibilityMonitoring(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.trackFileUpload('video', 50000000, 10000, false);
    });

    expect(compatibilityMonitoring.trackPerformance).toHaveBeenCalledWith(
      'admin_upload_video_failure',
      1,
      'count'
    );
  });
});

describe('CompatibilityMonitoringProvider', () => {
  it('should provide monitoring context', () => {
    const { result } = renderHook(() => useCompatibilityMonitoringContext(), {
      wrapper: TestWrapper
    });

    expect(result.current.monitoring).toBeDefined();
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.config).toBeDefined();
    expect(typeof result.current.updateConfig).toBe('function');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCompatibilityMonitoringContext());
    }).toThrow('useCompatibilityMonitoringContext must be used within a CompatibilityMonitoringProvider');
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useCompatibilityMonitoringContext(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.updateConfig({ sampleRate: 0.5 });
    });

    expect(result.current.config.sampleRate).toBe(0.5);
  });
});