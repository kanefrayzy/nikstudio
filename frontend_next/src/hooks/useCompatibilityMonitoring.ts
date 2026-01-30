/**
 * React Hook for Compatibility Monitoring Integration
 * Provides easy integration with the monitoring system for React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  compatibilityMonitoring, 
  monitoringUtils,
  // CompatibilityMonitoringService 
} from '@/lib/compatibility-monitoring';
import { CompatibilityError } from '@/lib/compatibility-error-handler';
import { browserDetectionService } from '@/lib/browser-detection';

export interface UseCompatibilityMonitoringOptions {
  trackPageView?: boolean;
  trackFeatureUsage?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
  component?: string; // Component name for tracking
}

export interface CompatibilityMonitoringHook {
  trackFeature: (feature: string, polyfillName?: string) => void;
  trackError: (error: CompatibilityError) => void;
  trackPerformance: (metric: string, value: number, category: 'polyfill' | 'fallback' | 'detection' | 'rendering') => void;
  trackPolyfillLoad: (polyfillName: string, loadFn: () => Promise<void>) => Promise<void>;
  trackFeatureDetection: <T>(feature: string, detectionFn: () => T) => T;
  trackFallbackRender: (fallbackName: string, renderFn: () => Promise<void>) => Promise<void>;
  getBrowserInfo: () => ReturnType<typeof browserDetectionService.getBrowserInfo>;
  isMonitoringEnabled: boolean;
}

/**
 * Hook for integrating compatibility monitoring into React components
 */
export function useCompatibilityMonitoring(
  options: UseCompatibilityMonitoringOptions = {}
): CompatibilityMonitoringHook {
  const {
    trackPageView = true,
    trackFeatureUsage = true,
    trackErrors = true,
    trackPerformance = true,
    component
  } = options;

  const hasTrackedPageView = useRef(false);
  const componentMountTime = useRef(Date.now());

  // Track page view on mount
  useEffect(() => {
    if (trackPageView && !hasTrackedPageView.current) {
      compatibilityMonitoring.trackBrowserUsage();
      hasTrackedPageView.current = true;
    }
  }, [trackPageView]);

  // Track component mount performance
  useEffect(() => {
    if (trackPerformance && component) {
      const mountTime = Date.now() - componentMountTime.current;
      compatibilityMonitoring.trackPerformance(
        `component_mount_${component}`,
        mountTime,
        'ms',
        'rendering'
      );
    }
  }, [trackPerformance, component]);

  // Set up error event listener
  useEffect(() => {
    if (!trackErrors) return;

    const handleCompatibilityError = (event: CustomEvent) => {
      const { errors } = event.detail;
      errors.forEach((error: CompatibilityError) => {
        compatibilityMonitoring.trackCompatibilityError(error);
      });
    };

    window.addEventListener('compatibility-error', handleCompatibilityError as EventListener);

    return () => {
      window.removeEventListener('compatibility-error', handleCompatibilityError as EventListener);
    };
  }, [trackErrors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackPerformance && component) {
        const totalTime = Date.now() - componentMountTime.current;
        compatibilityMonitoring.trackPerformance(
          `component_lifetime_${component}`,
          totalTime,
          'ms',
          'rendering'
        );
      }
    };
  }, [trackPerformance, component]);

  const trackFeature = useCallback((feature: string, polyfillName?: string) => {
    if (!trackFeatureUsage) return;
    
    compatibilityMonitoring.trackFeatureSupport(feature, polyfillName);
  }, [trackFeatureUsage]);

  const trackError = useCallback((error: CompatibilityError) => {
    if (!trackErrors) return;
    
    compatibilityMonitoring.trackCompatibilityError(error);
  }, [trackErrors]);

  const trackPerformanceMetric = useCallback((
    metric: string, 
    value: number, 
    category: 'polyfill' | 'fallback' | 'detection' | 'rendering'
  ) => {
    if (!trackPerformance) return;
    
    const fullMetric = component ? `${component}_${metric}` : metric;
    compatibilityMonitoring.trackPerformance(fullMetric, value, 'ms', category);
  }, [trackPerformance, component]);

  const trackPolyfillLoad = useCallback(async (
    polyfillName: string, 
    loadFn: () => Promise<void>
  ): Promise<void> => {
    if (!trackPerformance && !trackFeatureUsage) {
      return loadFn();
    }
    
    return monitoringUtils.trackPolyfillLoad(polyfillName, loadFn);
  }, [trackPerformance, trackFeatureUsage]);

  const trackFeatureDetection = useCallback(<T>(
    feature: string, 
    detectionFn: () => T
  ): T => {
    if (!trackPerformance && !trackFeatureUsage) {
      return detectionFn();
    }
    
    return monitoringUtils.trackFeatureDetection(feature, detectionFn);
  }, [trackPerformance, trackFeatureUsage]);

  const trackFallbackRender = useCallback(async (
    fallbackName: string, 
    renderFn: () => Promise<void>
  ): Promise<void> => {
    if (!trackPerformance) {
      return renderFn();
    }
    
    return monitoringUtils.trackFallbackRender(fallbackName, renderFn);
  }, [trackPerformance]);

  const getBrowserInfo = useCallback(() => {
    return browserDetectionService.getBrowserInfo();
  }, []);

  return {
    trackFeature,
    trackError,
    trackPerformance: trackPerformanceMetric,
    trackPolyfillLoad,
    trackFeatureDetection,
    trackFallbackRender,
    getBrowserInfo,
    isMonitoringEnabled: true // Could be made configurable
  };
}

/**
 * Hook specifically for tracking polyfill usage
 */
export function usePolyfillMonitoring() {
  const { trackFeature, trackPolyfillLoad, trackPerformance } = useCompatibilityMonitoring({
    trackFeatureUsage: true,
    trackPerformance: true
  });

  const loadPolyfillWithTracking = useCallback(async (
    polyfillName: string,
    loadFn: () => Promise<void>,
    feature?: string
  ) => {
    const startTime = performance.now();
    
    try {
      await trackPolyfillLoad(polyfillName, loadFn);
      
      if (feature) {
        trackFeature(feature, polyfillName);
      }
      
      const loadTime = performance.now() - startTime;
      trackPerformance(`polyfill_success_${polyfillName}`, loadTime, 'polyfill');
      
      return true;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      trackPerformance(`polyfill_error_${polyfillName}`, loadTime, 'polyfill');
      
      console.error(`Failed to load polyfill ${polyfillName}:`, error);
      return false;
    }
  }, [trackFeature, trackPolyfillLoad, trackPerformance]);

  return {
    loadPolyfillWithTracking,
    trackFeature,
    trackPerformance
  };
}

/**
 * Hook for tracking feature detection performance
 */
export function useFeatureDetectionMonitoring() {
  const { trackFeatureDetection, trackFeature, trackPerformance } = useCompatibilityMonitoring({
    trackFeatureUsage: true,
    trackPerformance: true
  });

  const detectFeatureWithTracking = useCallback(<T>(
    feature: string,
    detectionFn: () => T,
    onUnsupported?: () => void
  ): T => {
    const result = trackFeatureDetection(feature, detectionFn);
    
    // Track the result
    trackFeature(feature);
    
    // Handle unsupported features
    if (!result && onUnsupported) {
      const startTime = performance.now();
      onUnsupported();
      const fallbackTime = performance.now() - startTime;
      trackPerformance(`fallback_${feature}`, fallbackTime, 'fallback');
    }
    
    return result;
  }, [trackFeatureDetection, trackFeature, trackPerformance]);

  return {
    detectFeatureWithTracking,
    trackFeatureDetection,
    trackFeature
  };
}

/**
 * Hook for tracking component-specific compatibility metrics
 */
export function useComponentCompatibilityMonitoring(componentName: string) {
  const monitoring = useCompatibilityMonitoring({
    component: componentName,
    trackPageView: false, // Don't track page views for individual components
    trackFeatureUsage: true,
    trackErrors: true,
    trackPerformance: true
  });

  const trackComponentError = useCallback((
    feature: string,
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const browserInfo = monitoring.getBrowserInfo();
    
    const compatError: CompatibilityError = {
      type: 'javascript',
      feature: `${componentName}_${feature}`,
      browser: browserInfo,
      fallbackApplied: false,
      message: `Component error in ${componentName}: ${error.message}`,
      originalError: error,
      timestamp: Date.now(),
      severity
    };
    
    monitoring.trackError(compatError);
  }, [componentName, monitoring]);

  const trackComponentFeature = useCallback((feature: string, polyfillName?: string) => {
    monitoring.trackFeature(`${componentName}_${feature}`, polyfillName);
  }, [componentName, monitoring]);

  const trackComponentPerformance = useCallback((
    operation: string,
    duration: number,
    category: 'polyfill' | 'fallback' | 'detection' | 'rendering' = 'rendering'
  ) => {
    monitoring.trackPerformance(`${componentName}_${operation}`, duration, category);
  }, [componentName, monitoring]);

  return {
    ...monitoring,
    trackComponentError,
    trackComponentFeature,
    trackComponentPerformance,
    componentName
  };
}

/**
 * Hook for monitoring admin interface compatibility
 */
export function useAdminCompatibilityMonitoring() {
  const monitoring = useCompatibilityMonitoring({
    component: 'admin',
    trackPageView: true,
    trackFeatureUsage: true,
    trackErrors: true,
    trackPerformance: true
  });

  const trackAdminAction = useCallback((
    action: string,
    duration?: number,
    success: boolean = true
  ) => {
    if (duration) {
      monitoring.trackPerformance(
        `admin_action_${action}`,
        duration,
        'rendering'
      );
    }

    // Track action success/failure
    monitoring.trackPerformance(
      `admin_action_${action}_${success ? 'success' : 'failure'}`,
      1,
      'rendering'
    );
  }, [monitoring]);

  const trackFileUpload = useCallback((
    fileType: 'image' | 'video',
    fileSize: number,
    uploadTime: number,
    success: boolean
  ) => {
    monitoring.trackPerformance(`admin_upload_${fileType}_time`, uploadTime, 'rendering');
    monitoring.trackPerformance(`admin_upload_${fileType}_size`, fileSize, 'rendering');
    monitoring.trackPerformance(
      `admin_upload_${fileType}_${success ? 'success' : 'failure'}`,
      1,
      'rendering'
    );
  }, [monitoring]);

  return {
    ...monitoring,
    trackAdminAction,
    trackFileUpload
  };
}