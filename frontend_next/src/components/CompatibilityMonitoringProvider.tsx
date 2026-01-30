/**
 * Compatibility Monitoring Provider
 * Initializes and manages the compatibility monitoring system
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  compatibilityMonitoring, 
  CompatibilityMonitoringService,
  type MonitoringConfig 
} from '@/lib/compatibility-monitoring';
// import { compatibilityErrorHandler } from '@/lib/compatibility-error-handler';

interface CompatibilityMonitoringContextType {
  monitoring: CompatibilityMonitoringService;
  isInitialized: boolean;
  config: Partial<MonitoringConfig>;
  updateConfig: (newConfig: Partial<MonitoringConfig>) => void;
}

const CompatibilityMonitoringContext = createContext<CompatibilityMonitoringContextType | null>(null);

interface CompatibilityMonitoringProviderProps {
  children: ReactNode;
  config?: Partial<MonitoringConfig>;
  enableInDevelopment?: boolean;
}

export function CompatibilityMonitoringProvider({
  children,
  config = {},
  enableInDevelopment = false
}: CompatibilityMonitoringProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Partial<MonitoringConfig>>(config);

  useEffect(() => {
    initializeMonitoring();
    
    return () => {
      // Cleanup on unmount
      compatibilityMonitoring.stop();
    };
  }, []);

  const initializeMonitoring = async () => {
    try {
      // Determine if monitoring should be enabled
      const shouldEnable = process.env.NODE_ENV === 'production' || enableInDevelopment;
      
      const finalConfig: Partial<MonitoringConfig> = {
        enabled: shouldEnable,
        sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 100% in dev, 10% in prod
        reportingEndpoint: process.env.NEXT_PUBLIC_MONITORING_ENDPOINT,
        batchSize: 50,
        flushInterval: 30000, // 30 seconds
        enablePerformanceTracking: true,
        enableErrorTracking: true,
        enableUsageTracking: true,
        enableFeatureTracking: true,
        maxStorageSize: 1000,
        ...currentConfig
      };

      // Initialize monitoring with config
      // const monitoringService = new CompatibilityMonitoringService(finalConfig);
      
      // Set up error handler integration
      setupErrorHandlerIntegration();
      
      // Set up global error tracking
      setupGlobalErrorTracking();
      
      // Track initial page load
      if (finalConfig.enabled) {
        trackInitialPageLoad();
      }

      setIsInitialized(true);
      
      console.log('Compatibility monitoring initialized', {
        enabled: finalConfig.enabled,
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      console.error('Failed to initialize compatibility monitoring:', error);
      setIsInitialized(false);
    }
  };

  const setupErrorHandlerIntegration = () => {
    // Listen for compatibility errors and forward them to monitoring
    window.addEventListener('compatibility-error', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { errors } = customEvent.detail;
      errors.forEach((error: any) => {
        compatibilityMonitoring.trackCompatibilityError(error);
      });
    });
  };

  const setupGlobalErrorTracking = () => {
    // Track unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      if (event.filename && (
        event.filename.includes('polyfill') || 
        event.filename.includes('compatibility')
      )) {
        compatibilityMonitoring.trackPerformance(
          'global_error',
          1,
          'count',
          'detection',
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            message: event.message
          }
        );
      }
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('polyfill')) {
        compatibilityMonitoring.trackPerformance(
          'unhandled_promise_rejection',
          1,
          'count',
          'polyfill',
          {
            reason: event.reason.toString()
          }
        );
      }
    });
  };

  const trackInitialPageLoad = () => {
    // Track page load performance
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        
        // Track various load metrics
        compatibilityMonitoring.trackPerformance(
          'page_load_time',
          navigation.loadEventEnd - navigation.startTime,
          'ms',
          'rendering'
        );
        
        compatibilityMonitoring.trackPerformance(
          'dom_content_loaded',
          navigation.domContentLoadedEventEnd - navigation.startTime,
          'ms',
          'rendering'
        );
        
        compatibilityMonitoring.trackPerformance(
          'first_paint',
          navigation.responseStart - navigation.startTime,
          'ms',
          'rendering'
        );
      }
    }

    // Track initial browser usage
    compatibilityMonitoring.trackBrowserUsage();
  };

  const updateConfig = (newConfig: Partial<MonitoringConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
  };

  const contextValue: CompatibilityMonitoringContextType = {
    monitoring: compatibilityMonitoring,
    isInitialized,
    config: currentConfig,
    updateConfig
  };

  return (
    <CompatibilityMonitoringContext.Provider value={contextValue}>
      {children}
    </CompatibilityMonitoringContext.Provider>
  );
}

/**
 * Hook to access the compatibility monitoring context
 */
export function useCompatibilityMonitoringContext() {
  const context = useContext(CompatibilityMonitoringContext);
  
  if (!context) {
    throw new Error(
      'useCompatibilityMonitoringContext must be used within a CompatibilityMonitoringProvider'
    );
  }
  
  return context;
}

/**
 * HOC to wrap components with monitoring
 */
export function withCompatibilityMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const { monitoring, isInitialized } = useCompatibilityMonitoringContext();
    // const [renderTime, setRenderTime] = useState<number | null>(null);

    useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        if (isInitialized && componentName) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          monitoring.trackPerformance(
            `component_render_${componentName}`,
            duration,
            'ms',
            'rendering'
          );
        }
      };
    }, [monitoring, isInitialized]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withCompatibilityMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Component for displaying monitoring status (development only)
 */
export function MonitoringStatus() {
  const { isInitialized, config } = useCompatibilityMonitoringContext();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50">
      <div>Monitoring: {isInitialized ? '✅' : '❌'}</div>
      <div>Enabled: {config.enabled ? '✅' : '❌'}</div>
      <div>Sample Rate: {(config.sampleRate || 0) * 100}%</div>
    </div>
  );
}

/**
 * Component for flushing metrics manually (development only)
 */
export function MonitoringControls() {
  const { monitoring, isInitialized } = useCompatibilityMonitoringContext();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleFlush = async () => {
    try {
      await monitoring.flush();
      console.log('Metrics flushed successfully');
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  };

  const handleGenerateReport = () => {
    const report = monitoring.generateReport();
    console.log('Monitoring Report:', report);
  };

  const handleGetStats = () => {
    const browserStats = monitoring.getBrowserStats();
    const featureStats = monitoring.getFeatureStats();
    const errorStats = monitoring.getErrorStats();
    const performanceStats = monitoring.getPerformanceStats();
    
    console.log('Browser Stats:', browserStats);
    console.log('Feature Stats:', featureStats);
    console.log('Error Stats:', errorStats);
    console.log('Performance Stats:', performanceStats);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded z-50 space-y-1">
      <div className="font-bold">Monitoring Controls</div>
      <button 
        onClick={handleFlush}
        className="block w-full text-left hover:bg-white/20 px-1 rounded"
      >
        Flush Metrics
      </button>
      <button 
        onClick={handleGenerateReport}
        className="block w-full text-left hover:bg-white/20 px-1 rounded"
      >
        Generate Report
      </button>
      <button 
        onClick={handleGetStats}
        className="block w-full text-left hover:bg-white/20 px-1 rounded"
      >
        Show Stats
      </button>
    </div>
  );
}